---
title: Credit Limit Increase Flows
category: product
order: 7
date: '2024-07'
role: Engineer — intern project, shipped to production
context: Wio Bank · Retail cards
summary: >-
  Bank-initiated and customer-initiated credit limit increases, with audit logging
  and approval workflows — improving operational turnaround by 30%.
problem: >-
  Two different journeys reach the same outcome: the bank offers an increase, or
  the customer asks for one. They need different approvals and different evidence,
  but the same auditability.
approach: >-
  A shared approval workflow with distinct entry points, and audit logging on
  every state change so an operations reviewer can reconstruct any decision.
decision: >-
  Keep one approval spine rather than two parallel flows. The initiating party
  changes who approves, not what has to be recorded.
outcome: >-
  30% improvement in operational turnaround time.
metrics:
  - value: 30%
    label: faster turnaround
tech:
  - Java
  - Spring Boot
  - REST APIs
---
