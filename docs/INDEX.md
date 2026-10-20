# Documentation index — pi-zk-nft-gate

A read-only capability probe **and** a design document for zero-knowledge-gated
NFT access on Pi Network.

| Document | What it covers |
|---|---|
| [`BOUNDARIES.md`](BOUNDARIES.md) | every claim this repository does **not** make, and why |
| [`DECISIONS.md`](DECISIONS.md) | why a probe and a design sit together, and why no deployment is claimed |
| [`SOURCES.md`](SOURCES.md) | the measured RPC surface and the design as a document |
| [`VERIFICATION.md`](VERIFICATION.md) | how to reproduce the 12 offline checks |
| [`../README.md`](../README.md) | the full description and quick start |
| [`../llms.txt`](../llms.txt) | a compact summary for machine readers |

## The one-line answer

> Pi Protocol v25 introduced BN254 + Poseidon ZK primitives. This repository
> **probes** what the current Pi RPC actually exposes and **documents** the design
> of a ZK gate — without asserting that a ZK gate is deployed on Pi today.

## Claim status at a glance

| Statement | Status |
|---|---|
| Which RPC methods respond | **measured** (2026-10-19, protocol 28) |
| No method in the probe list takes or verifies a ZK proof | **measured** |
| Mainnet Soroban RPC is unreachable | **measured** (HTTP 503) |
| The gate proves a predicate, not an identity | **documented** (design) |
| A ZK gate is deployed on Pi today | **not claimed** |
| BN254 / Poseidon are exposed through the RPC surface | **not claimed** |
| Any specific circuit is secure | **not claimed** |
