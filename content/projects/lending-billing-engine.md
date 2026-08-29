---
title: Lending Billing Engine
category: systems
featured: true
order: 2
date: '2025-06'
role: Architect and engineer
context: Wio Bank · Retail and SME lending
summary: >-
  A Kafka-based billing engine that took monthly statement accuracy to 99% across
  100K+ statements, removing a recurring source of customer billing disputes.
problem: >-
  Statement generation at this volume is unforgiving: a single double-processed
  event becomes a customer-visible billing error, and billing errors become
  support tickets and disputes rather than silent data problems.
approach: >-
  Partition-aware processing so related events for one account are ordered,
  idempotent workflows so redelivery is safe, and automated reconciliation to
  catch drift rather than waiting for a customer to report it.
decision: >-
  Treat redelivery as normal rather than exceptional. Kafka guarantees at-least
  once, so correctness has to come from the consumer being safe to run twice —
  designing for exactly-once delivery would have been designing against the
  broker.
outcome: >-
  99% financial accuracy across 100K+ monthly statements.
metrics:
  - value: 99%
    label: billing accuracy
  - value: 100K+
    label: monthly statements
tech:
  - Java
  - Spring Boot
  - Kafka
  - PostgreSQL
flow:
  - Loan events
  - Partitioned topic
  - Idempotent consumer
  - Reconciliation
  - Statement
---
