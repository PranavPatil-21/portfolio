---
title: "I Built an AI Teammate. The First Thing I Taught It Was How to Say “I Don’t Know.”"
date: "2026-06-29"
draft: true
tags:
  - "agentic-ai-architecture"
  - "software-architecture"
  - "software-development"
  - "ai-agent"
  - "ai"
canonicalUrl: "https://medium.com/@pranavnarendrapatil.2104/i-built-an-ai-teammate-the-first-thing-i-taught-it-was-how-to-say-i-dont-know-484e80aa36c5"
---

> _On-call investigation, every claim cited, and why I built one agent per team instead of one big bot for everyone._

Being on-call is, secretly, one of the more interesting parts of the job. Things break, you peel them open, you learn corners of the system you’d never have touched otherwise. There’s a kind of detective satisfaction to it.

Until five things break at once. Then you remember you are one person, with one terminal, and a finite number of tabs.

But honestly — the part that wears me down isn’t volume. It’s a quieter realization that creeps in around the third or fourth incident of the week: _someone has already investigated this._ There’s a Slack thread from two months ago. There’s an RCA doc. There’s a comment in the code that explains exactly why this corner is weird. And here I am, opening the same logs, forming the same hypothesis from scratch — not because I’m lazy, but because I genuinely don’t know the answer already exists.

The system that knows doesn’t know that it knows.

That’s what got me building this. Like everyone in 2026. And I’d be the first to admit it isn’t a groundbreaking idea — most attempts collapse into one of two shapes: a central team that becomes the bottleneck for every other team’s adoption, or a confident bot that hallucinates just often enough that nobody trusts it.

What’s working, so far, came down to two commitments — one architectural, one structural — and a bunch of concrete decisions underneath them that I want to actually walk through, because the design lives in the details.

### Commitment 1: One agent per team. No central brain.

![](https://cdn-images-1.medium.com/max/1024/0*UmMvY8FCNnBPTTjl.png)

Instead of one assistant for everyone, every team gets their own. Each runs as a separate Python service with its own pyproject.toml, its own deployment, its own on-call. They discover each other through a small registry and talk over two open protocols:

*   **A2A (Agent-to-Agent)** for synchronous calls between agents — JSON-RPC over HTTP with SSE for streaming. Every agent exposes /.well-known/agent.json (capabilities) and /tasks (the call endpoint).
*   **MCP (Model Context Protocol)** for tools. Each org-shared data source — code search, log search, wiki, databases, API gateway — runs as an MCP server. Agents are MCP _hosts_; they connect to whichever servers their config allows.

The piece in the middle has _no domain knowledge_. Run grep for any business term across the platform code and you get zero hits. The core is protocols, identity propagation (OBO tokens for downstream RBAC), audit, and an LLM gateway. Everything that matters about _what a team's agent knows_ lives in agents/`<team>`/.

A team onboards by dropping a folder with team.yaml, registering, and starting their container. The router at the front (the "concierge") picks them up automatically.

### Commitment 2: Citation-or-refuse, enforced in code

This is the part I’d encourage anyone in this space to steal directly.

![](https://cdn-images-1.medium.com/max/1024/0*1EbmJHzR-7L0gY4n.png)

I don’t claim the system is _accurate_. Accuracy is unfalsifiable. I claim something narrower and far more enforceable: **every factual sentence in every answer must trace back to a source the system actually read.** If it can’t, the sentence is rewritten as _“I don’t have evidence for X from the sources I checked”_ or removed.

This is enforced through a schema, not a prompt. Here’s the type that holds all evidence in the system:

class Finding(BaseModel):  
    source: SourceKind                # "code\_search" | "logs" | "wiki" | ...  
    locator: str                      # "repo/src/.../Service.java:142"  
    evidence: str                     # the actual quoted snippet (≤2000 chars)  
    relevance: float                  # 0.0 – 1.0  
    fetched\_at: datetime

class SpecialistOutput(BaseModel):  
    specialist: str  
    findings: list\[Finding\]  # may be empty — that's a valid answer  
    summary: str          # every claim must cite \[N\] into findings  
    confidence: Confidence   # high | medium | low | insufficient\_evidence  
    tools\_used: list\[str\]  
    tokens\_used: int  
    duration\_ms: int

Two things matter about this schema:

1.  **It is forced.** Specialists use [Instructor](https://github.com/instructor-ai/instructor) over Anthropic tool-use to produce SpecialistOutput. If the model emits malformed output, Instructor re-prompts with the validation error appended. After two retries, the specialist returns confidence="insufficient\_evidence" and the drafter handles it as a first-class outcome. _Refusing is a feature._
2.  **The drafter never sees raw model output.** It only sees list\[SpecialistOutput\]. So it physically cannot compose a sentence from a claim that didn't go through a specialist's evidence-gathering step.

The drafter prompt is constrained to “compose only from the supplied findings; cite \[N\] after every factual sentence." The UI parses those \[N\] markers and renders each as a clickable footnote linking to locator. A user can click any number in any answer and land on the exact line of code or log entry that produced it. If they can't, the sentence isn't in the answer.

### How a question actually flows through the system

![](https://cdn-images-1.medium.com/max/1024/0*iu84LqIBovMp6ANJ.png)

Inside a team agent is a LangGraph StateGraph — same topology for every team, parameterised via a small TeamGraphBindings dataclass. Six nodes:

question → triage → retrieve(KB) → route → { dispatch\_one\_shot | reasoning\_loop } → drafter → answer

State is a TypedDict that every node reads and writes:

class GraphState(TypedDict):  
    question: str  
    triage: TriageResult           # {intent, rationale, entities, missing}  
    knowledge\_chunks: list\[Chunk\]  # BM25 hits over the team's KB  
    strategy: str                  # one of 9 (see below)  
    findings: list\[Finding\]        # filled by dispatch  
    observations: list\[Step\]       # filled by the loop  
    final\_answer: str  
    # ... plus llm\_calls, elapsed\_ms, stop\_reason for observability

The interesting part is the route node. Rather than letting a single planner LLM guess what shape of investigation to run, the router classifies the question into one of nine strategies using deterministic fast-paths first (JSON paste → incident-paste, ticket key alone → ticket-followup, "explain X" → conceptual, cohort regex → cohort-list) and an LLM fallback only when the shape is ambiguous.

That classification picks between two execution paths.

dispatch\_one\_shot — for questions with a fixed shape (find a cohort, locate code, check service health). It runs a stage-based playbook. Stage 1 might be code\_explorer finding a log signature; stage 2 then fans out kibana\_explorer + jira\_reader + rca\_reader in parallel using stage 1's findings:

\# simplified  
for stage in playbook\[strategy\]:  
    results = await asyncio.gather(\*(  
        run\_specialist(spec, args, prior\_outputs)  
        for spec, args in stage  
    ))  
    prior\_outputs.update(results)

Wall time = sum(stages) with each stage being max(parallel specialists).

![](https://cdn-images-1.medium.com/max/1024/0*OGer-gJAeXTecE1O.png)

reasoning\_loop — for investigations that need step-by-step composition (ticket follow-ups, incident pastes, "any failures in X concept past 24h"). An orchestrator LLM picks specialists step by step, reading each step's result before deciding the next. Each step can be either:

*   **SERIAL** — one specialist, when the next probe needs the prior output. (code\_explorer finds a log signature → kibana\_explorer uses it as must\_phrases.)
*   **PARALLEL FORK** — 1 to 3 specialists in parallel, when probes are independent. Implemented via asyncio.gather over the orchestrator's OrchestratorDecision.invocations.

The loop has hard guardrails: **max 8 steps, 12 LLM calls, 45 seconds wall time.** When any trips, the drafter takes over with whatever evidence was gathered. The loop also emits step events back through an event queue so the UI can stream the chain as it unfolds — step 1: jira\_reader → step 2: code\_explorer + kibana\_flow\_analyst (parallel) → step 3: kibana\_explorer → answer.

Naïvely sequential, a complex investigation takes ~25 seconds. With graph-level + step-level parallelism it lands around 8, paced by the slowest specialist in the widest fan-out.

![](https://cdn-images-1.medium.com/max/1024/0*Y0Lnmx6-h9LPd5c3.png)

### What a specialist actually is

A specialist is the smallest unit of “go look at one thing.” Each one:

*   Has **1–4 MCP tools** — not more. A 30-tool prompt produces confused tool selection. Splitting by tool family is the cure.
*   Declares a **hard token budget** enforced at the LiteLLM gateway:

BUDGET = SpecialistBudget(  
    input\_tokens=8000,  
    output\_tokens=2000,  
    max\_tool\_calls=6,  
    max\_wall\_time\_s=20,  
)

Exceed any limit and the in-progress LLM call is cancelled. The specialist returns whatever findings it has so far, marked insufficient\_evidence if it didn't reach a useful state. **No speculation to fill the gap.**

*   Is **stateless across calls.** It takes args in, returns SpecialistOutput out. No memory between calls. No shared state with other specialists. That's what makes them unit-testable in isolation, reusable across teams, and trivially parallelisable.

Today’s specialists in the reference team: code\_explorer (code search + file reads), rca\_reader (vector search over past incidents + wiki search), kibana\_explorer (log queries with its own internal strategy planner — trace\_first vs service\_window vs terms\_aggregation), kibana\_flow\_analyst (N count queries per concept's flow signals), jira\_reader. Each is ~150–300 lines of Python plus a system prompt.

### Tying it together: the LLM gateway, observability, persistence

A few less-glamorous pieces that matter more than they sound:

*   **LiteLLM as the LLM gateway.** Every LLM call routes through it. One config file maps logical names (drafter\_sonnet, verifier\_opus, planner\_haiku) to providers and applies prompt caching, rate limits, and per-specialist budgets. Swapping models is a YAML change, not a code change.
*   **Langfuse for tracing.** Every LangGraph node emits a span. Every specialist’s MCP tool calls are children of its span. When a user clicks “view work” in the UI, that collapsible tree comes straight from Langfuse traces.
*   **LangGraph checkpointing on MongoDB.** State is persisted at every node transition. This is what enables resume across process restarts and human-in-the-loop pauses for write actions — the graph hits a LangGraph interrupt, persists, and resumes when the user replies.
*   **A golden-set in CI.** A small held-out set of (question, expected-citation) pairs runs on every deploy. Regression = a question that used to cite the right source now cites a different one (or refuses when it shouldn't).

### How a team extends the system

![](https://cdn-images-1.medium.com/max/1024/0*AObiMAJ29DsIjtzU.png)

The graph topology lives in core/graph/. A team plugs in via a single dataclass:

TeamGraphBindings(  
    team\_config,            # protocol — failed-event parser, etc.  
    specialists,            # dict\[name → BaseSubAgent\]  
    triage\_fn,              # async callable  
    retrieve\_fn,            # KB lookup against the team's index  
    route\_fn,               # strategy classifier  
    draft\_conceptual\_fn,    # streams conceptual answer  
    draft\_ops\_fn,           # streams one-shot answer  
    draft\_loop\_fn,          # streams loop answer  
    loop\_strategies,        # set of strategy ids that use the loop  
)

A team’s whole contribution is a team.yaml, a team\_config.py (~50 lines), a graph.py (~250 lines wiring the bindings), an optional set of team-specific specialists if the generic ones don't suffice, and three small plug-ins discovered by convention: case\_classifier.py (paste classification), curl\_templates.yaml (allowlisted actions), slack\_intents.py (Slack routing).

Two teams compile through the same build\_team\_graph(bindings) function today. That's the proof of standardisation — the topology, parallel fan-out, checkpointing, verifier, and citation-rendering are not rewritten per team.

### What I’d tell someone starting this today

1.  **Don’t build the central thing.** Every instinct will push you toward “let’s just have one assistant and add teams over time.” That ceiling is lower than you think.
2.  **Pick standard protocols early.** A2A, MCP. Don’t invent a wire format.
3.  **Force the output schema with Instructor (or your stack’s equivalent).** Prompts that say “please return JSON” are a different category of reliability from a Pydantic model that fails validation and retries.
4.  **Make hallucination a structural problem.** Structured findings, footnotes in the UI, a verifier that walks the draft against the findings. If your system can’t _refuse_, your system can’t be trusted.
5.  **Treat agents as services, not chat sessions.** Each has an identity, a deployment, metrics, an on-call rotation.

### This is v1 — and I’m still working on it

The system runs end-to-end today, but I’d be lying if I said it was done. What I’m working on next:

*   **More specialists.** A real data-lookup specialist (databases + vendor APIs through the gateway), a proper metrics specialist (APM traces, not just logs), a design-context specialist.
*   **A verifier as a separate pass, every time.** Today the verifier and drafter share a single LLM call in some paths. Splitting them is cheap insurance against the drafter rationalising an uncited claim. This matters more when the agent starts taking write actions.
*   **Cross-team composition, for real.** The router can send a question to one team’s agent. Routing a question that genuinely needs _two_ teams in parallel, then merging their cited findings into a single answer, is the next interesting problem.
*   **A golden-set CI for answer quality.** Today I check regressions by hand. A small held-out set of (question, expected-citation) pairs scored on every deploy is the difference between "I think it's still working" and "I know it's still working."
*   **Long-term per-user memory — but only after seeing real usage.** Designing memory before you’ve seen real usage patterns guarantees you’ll design the wrong thing.

**Where I’d genuinely welcome input:**

*   **How do you bound a reasoning loop without making it feel dumb?** Too many iterations and it spirals. Too few and it gives up on questions it could have solved. The right stopping criterion sits somewhere between “found enough evidence” and “ran out of useful moves,” and I haven’t fully cracked the heuristic.
*   **What’s the right unit of approval for write actions?** Read-only is easy. The moment an agent can _do_ something — replay an event, retry a job, update a record — the question of who approved what, at what granularity, gets serious. Per-action? Per-session? Per-template? I lean per-template-with-allowlist, but I’m not sure that scales.
*   **How do you measure trust over time?** Citation rate and refusal rate are easy. _Whether engineers actually act on the bot’s answers_ is much harder, and it’s the only metric that ultimately matters.
*   **What’s the failure mode you’d worry about that I haven’t?** This is the one I’d most like input on. Architectures fail in the ways their builders aren’t looking for.

### The honest part

None of this is novel. Citation-grounded generation is a well-trodden research area. MCP and A2A are protocols you can read on a weekend. LangGraph is a library. Instructor is a library. The model is Claude. The hard part isn’t any single piece — it’s the discipline to make the structural choices (forced schemas, hard budgets, refusal as a first-class outcome, parallel fan-out at the graph level) instead of reaching for the next clever prompt.

On-call will still wake me up. Things will still break. But maybe the next time, the answer finds me a little sooner.

> **_One more bit of honesty:_**

> **_The concepts here — the federation shape, the citation-or-refuse contract, the LangGraph topology, why each piece exists — are mine. A lot of the code underneath was vibe-coded with Claude Opus 4.7. I’d argue that’s the right division of labour in 2026: the human owns the architecture and the constraints, the model owns the typing. The interesting part of the job moved up a layer._**

![](https://medium.com/_/stat?event=post.clientViewed&referrerSource=full_rss&postId=484e80aa36c5)
