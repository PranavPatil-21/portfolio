---
category: systems
title: AES Cryptosystem via Double Pendulum
summary: An AES encryption system whose key generation is driven by double-pendulum chaos — trading a conventional entropy source for one that is trivially reproducible from a seed and practically unpredictable without it.
date: 2023-09
order: 8
featured: true
tech: [C++, Cryptography, AES, Chaos Theory]
repo: https://github.com/PranavPatil-21
---

## The problem

AES is only as strong as the key material fed into it. The interesting question
is not the cipher but the source of entropy behind it, and whether that source
can be both unpredictable to an attacker and reproducible to the holder of the
seed.

## The decision

Use a double pendulum. It is the textbook chaotic system: arbitrarily small
differences in initial conditions diverge exponentially. Sampling its state
space gives key material that is deterministic to regenerate given the seed,
yet practically unpredictable without it — raising entropy and resistance to
key predictability without needing an external randomness source.
