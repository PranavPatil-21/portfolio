---
title: Asynchronous Lending Notifications
category: systems
featured: true
order: 3
date: '2025-03'
role: Engineer — design and delivery
context: Wio Bank · Retail and SME lending
summary: >-
  Repayment reminders that actually arrive. An asynchronous Kafka notification
  system handling 800K+ monthly events at under 1% delivery failure, which lifted
  on-time repayments by 40%.
problem: >-
  A missed repayment is often a missed reminder. At 800K+ events a month the
  delivery path is the product: if reminders are late, duplicated, or dropped, the
  customer pays late and the business absorbs it.
approach: >-
  Message queues to decouple notification from the transaction that triggers it,
  with idempotent consumers so a retry never becomes a second message to the
  customer.
decision: >-
  Optimise for not-annoying over not-missing. Duplicate reminders erode trust
  faster than a slightly late one, so the consumer deduplicates before it sends
  rather than after.
outcome: >-
  40% improvement in on-time repayments, under 1% delivery failure.
metrics:
  - value: 800K+
    label: monthly events
  - value: 40%
    label: better on-time repayment
  - value: <1%
    label: delivery failure
tech:
  - Java
  - Spring Boot
  - Kafka
  - Redis
flow:
  - Repayment due
  - Event queue
  - Dedupe
  - Channel fan-out
  - Customer
---
