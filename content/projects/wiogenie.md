---
title: WioGenie — Multi-Agent Incident Investigator
category: ai
featured: true
order: 1
date: '2026-01'
role: Architect and engineer — built from scratch
context: Wio Bank · internal platform
summary: >-
  When production breaks, the slow part is not the fix — it is the archaeology.
  WioGenie is a multi-agent AI system that does that archaeology across code,
  logs, Jira and RCA documents, and cites its source for every claim.
problem: >-
  A responder at 2am reconstructs a story from four disconnected places: a stack
  trace, the service that threw it, an old Jira thread, and a half-remembered
  RCA. That reconstruction is most of the time-to-resolution, and it is repeated
  from scratch by whoever happens to be on call.
approach: >-
  A set of specialised agents, each owning one source, coordinated over LangGraph
  with A2A for hand-off and MCP for tool access. LiteLLM keeps the model choice
  swappable rather than baked into the orchestration.
decision: >-
  Every claim carries a citation, and that constraint drove the architecture. The
  obvious design — retrieve context, let the model summarise — fails on the only
  axis that matters here: an investigator that is confidently wrong is worse than
  no investigator at all, because it spends the responder's attention instead of
  saving it.
outcome: >-
  Approved by engineering leadership for adoption.
tech:
  - FastAPI
  - LangGraph
  - LiteLLM
  - Claude
  - MCP
  - A2A
  - Python
flow:
  - Incident
  - Router agent
  - Code · Logs · Jira · RCA
  - Citation check
  - Answer
---
