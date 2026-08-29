---
title: AES Cryptosystem Keyed by a Double Pendulum
category: systems
featured: false
order: 8
date: '2023-09'
context: Personal project, built while at university
summary: >-
  An AES implementation whose key material comes from double-pendulum chaos —
  an experiment in where entropy comes from, rather than in the cipher itself.
problem: >-
  AES is only as strong as the key material fed into it. The interesting question
  is not the cipher but the source behind it: can one source be practically
  unpredictable to an attacker and still exactly reproducible for whoever holds
  the seed?
approach: >-
  Simulate a double pendulum, the textbook chaotic system, and sample its state
  over time to generate the key material AES then encrypts with.
decision: >-
  Take unpredictability and reproducibility from the same mechanism instead of
  two. A double pendulum diverges exponentially from arbitrarily close starting
  conditions, so the exact seed regenerates the exact key while a near-miss
  regenerates nothing useful — which is precisely the asymmetry key material
  needs.
outcome: >-
  A working end-to-end implementation, and a clearer sense of how much of a
  cryptosystem's strength sits outside the algorithm. An exercise, not a
  production cryptosystem.
tech:
  - C++
  - AES
  - Cryptography
  - Chaos Theory
flow:
  - Seed
  - Double pendulum
  - Sampled state
  - AES key
  - Ciphertext
---
