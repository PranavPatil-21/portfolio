---
title: Building a Multi-Agent Incident Investigator
excerpt: Notes on designing an AI system that investigates production incidents by reasoning across code, logs, tickets and RCA documents — with citations.
date: 2026-08-29
draft: true
tags: [AI, Agents, LangGraph, Distributed Systems]
---

## Why citations matter more than answers

An incident investigator that is confidently wrong is worse than no
investigator at all. The design constraint that shaped everything else was
that every claim the system makes must point back at the artifact it came
from — a line of code, a log entry, a Jira comment.

## Replace this

This is a placeholder article so the articles section has something to render.
Edit or delete it from the admin panel at `/admin`.
