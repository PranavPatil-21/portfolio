---
title: Credit Card Dashboard — Latency Under Peak Load
category: systems
order: 5
date: '2025-01'
role: Engineer
context: Wio Bank · Retail cards
summary: >-
  High-concurrency dashboard APIs cut from 3s to 1s at p95, with 50% more
  throughput under peak load.
problem: >-
  The card dashboard is the screen customers open most, and it was slowest exactly
  when most people were looking at it. Tail latency, not average, is what a
  customer experiences as "the app is slow".
approach: >-
  Query tuning and indexing against the real access patterns, then caching the
  reads that were both hot and tolerant of being slightly stale.
decision: >-
  Cache only what could be stale without misleading anyone. Balances and
  transaction state were left uncached — a stale balance is worse than a slow one.
outcome: >-
  p95 latency 3s to 1s, throughput up 50%.
metrics:
  - value: 3s → 1s
    label: p95 latency
  - value: 50%
    label: throughput increase
tech:
  - Java
  - Spring Boot
  - PostgreSQL
  - Redis
---
