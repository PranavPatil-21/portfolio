---
title: Underwriting Deduplication API
category: systems
order: 6
date: '2024-05'
role: Engineer — intern project, shipped to production
context: Wio Bank · underwriting pipeline
summary: >-
  A deduplication service inside the underwriting pipeline, using hashing and
  database constraints to halve latency on duplicate detection.
problem: >-
  Duplicate applications reaching underwriting waste assessment capacity and can
  produce two decisions for one applicant.
approach: >-
  Hash the identifying fields for a cheap first pass, and enforce the invariant
  with a database constraint so correctness does not depend on the application
  layer being right.
decision: >-
  Put the guarantee in the database. Application-level checks race under
  concurrency; a unique constraint does not.
outcome: >-
  50% latency reduction, with unit-tested validation integrated into the pipeline.
metrics:
  - value: 50%
    label: latency reduction
tech:
  - Java
  - Spring Boot
  - MySQL
---
