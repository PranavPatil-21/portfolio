---
title: FD-Backed SME Lending Journeys
category: product
featured: true
order: 4
date: '2025-09'
role: Engineer — workflow, eligibility and risk rules
context: Wio Bank · SME credit
summary: >-
  Secured credit journeys for SME customers, backed by fixed deposits — designing
  the workflow, eligibility computation, approval pipeline and risk validations.
  Conversion and retention rose 42%.
problem: >-
  SME applicants who fail unsecured underwriting are not necessarily bad credit —
  many hold deposits with the bank already. Without a secured path, that customer
  is simply declined and the relationship ends there.
approach: >-
  A distinct journey where the deposit is the security: eligibility computed
  against the held amount, an approval pipeline reflecting the lower risk, and
  validations covering the lien lifecycle.
decision: >-
  Model the security explicitly rather than treating it as a discount on an
  unsecured product. The lien has its own lifecycle — placed, held, released —
  and folding it into the existing flow would have coupled two things that fail
  independently.
outcome: >-
  42% increase in SME customer conversion and retention.
metrics:
  - value: 42%
    label: conversion and retention lift
tech:
  - Java
  - Spring Boot
  - PostgreSQL
---
