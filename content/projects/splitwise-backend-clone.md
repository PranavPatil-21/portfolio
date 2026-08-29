---
category: systems
title: Splitwise Backend Clone
summary: An expense-management backend that settles a group's debts in the fewest possible transactions — expense splitting, debt simplification, settlements and balance reconciliation over REST APIs.
date: 2023-04
order: 9
featured: true
tech: [Java, Spring Boot, REST APIs, MySQL]
repo: https://github.com/PranavPatil-21
---

## The problem

Splitting a bill is arithmetic. Settling a group is not. After a few weeks of
shared expenses, a group holds a dense graph of who owes whom, and paying it
off edge by edge means far more transfers than anyone actually needs to make.

## The decision

Treat settlement as a graph reduction rather than a ledger replay: collapse the
web of pairwise debts into the minimum number of transactions that leave every
balance at zero. The rest of the system — splitting, settlements, balance
reconciliation over REST APIs — exists to keep that graph accurate enough for
the reduction to be trusted.
