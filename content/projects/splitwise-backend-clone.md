---
title: Splitwise Backend Clone
category: systems
featured: false
order: 9
date: '2023-04'
context: Personal project, built while at university
summary: >-
  An expense-sharing backend that settles a group's debts in the fewest possible
  transfers — splitting, simplification, settlement and balance reconciliation
  over REST APIs.
problem: >-
  Splitting a bill is arithmetic. Settling a group is not. After a few weeks of
  shared expenses a group holds a dense web of who owes whom, and clearing it
  edge by edge means far more transfers than anyone actually needs to make.
approach: >-
  A Spring Boot service covering the whole loop — expenses, splits, settlements
  and running balances — with settlement treated as a graph problem rather than
  a replay of the ledger.
decision: >-
  Collapse the pairwise debts into the minimum set of transfers that leaves every
  balance at zero. That choice sets the bar for everything else: the rest of the
  system exists to keep the debt graph accurate enough for the reduction to be
  trusted.
outcome: >-
  A working backend for the full split-track-simplify-settle loop, built to
  understand how a familiar product behaves underneath its screens.
tech:
  - Java
  - Spring Boot
  - REST APIs
  - MySQL
flow:
  - Expense
  - Split
  - Debt graph
  - Simplify
  - Settlement
---
