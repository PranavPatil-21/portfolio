---
title: WioGenie — Multi-Agent Incident Investigator
summary: A multi-agent AI system that investigates production incidents by reasoning across code, logs, Jira and RCA documents — and cites its sources for every claim. Built at Wio Bank and approved by engineering leadership for adoption.
date: "2026"
order: 0
featured: true
tech: [FastAPI, LangGraph, LiteLLM, Claude, MCP, A2A, Multi-Agent Orchestration, Python]
---

## The problem

When something breaks in production, the slowest part is rarely the fix. It is
the archaeology: the on-call engineer stitching together a stack trace, a
service's source, an old Jira thread and a half-remembered RCA document before
they can even state what went wrong. That work is repetitive, it happens under
time pressure, and it is exactly the shape of problem an agent can carry.

WioGenie is a multi-agent system that does that stitching. It reasons across
code, logs, Jira tickets and RCA documents to produce an investigation an
engineer can act on.

## Why citations were the binding constraint

The obvious design — retrieve context, let the model summarise — fails on the
only axis that matters here. An incident investigator that is confidently wrong
is worse than no investigator at all, because it spends the responder's
attention rather than saving it.

So citation-backed reasoning was not a feature bolted on at the end; it was the
constraint that shaped the architecture. Every claim the system makes has to
point back at the artifact it came from — a line of code, a log entry, a Jira
comment. That requirement is what forces agents to be specialised per source,
what makes retrieval traceable rather than merely relevant, and what gives a
sceptical engineer a cheap way to verify the answer instead of trusting it.

## Who it is for

Engineers investigating production incidents — an audience that has to verify
before it trusts. That is the argument for citations doing the heavy lifting:
verifiability, not fluency, is what makes an answer usable at the moment
someone is deciding whether to act on it.

## How it is built

FastAPI as the service surface, LangGraph for agent orchestration and control
flow, LiteLLM for model routing, Claude as the reasoning model, and MCP plus
A2A for tool access and agent-to-agent communication across the sources it
investigates.

Architected from scratch and approved by engineering leadership for adoption.
