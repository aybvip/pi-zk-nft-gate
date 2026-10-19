# Pi ZK NFT Gate

A **read-only capability probe** and **design document** for zero-knowledge-gated NFT access on Pi Network.

> **Plainly:** Pi Protocol v25 introduced **BN254 + Poseidon** zero-knowledge
> primitives for privacy-preserving smart contracts. This tool **probes what the
> current Pi RPC actually exposes** for ZK-related capabilities (spoiler: the RPC
> surface itself does not name a ZK method — the capabilities live inside Soroban
> contracts), and **documents the design** of a gate that grants access on proof of
> a predicate without revealing the underlying identity.
>
> **It does not assert that a ZK gate is deployed on Pi today.**

## Why it exists

The combination of Pi's large-scale KYC infrastructure and its v25 ZK primitives
makes a ZK gate a natural fit: the verifier checks a **proof**, not a document.
But the capability is new and the surface is not obvious, so this repo does two
things a designer needs:

1. **Probe** — query the live RPC and report which methods respond, so the
   boundary between "protocol supports it" and "RPC exposes it" is measured,
   not assumed.
2. **Design** — a written design covering predicate, witness, proof, verifier
   contract, and the trust boundary between them.

## Quick start

```bash
node zk-gate.mjs --probe                 # probe live capabilities (read-only)
node zk-gate.mjs --design                # print the design document
node zk-gate.mjs --probe --network mainnet
```

No install. No API keys. No writes.

## Trust boundary

| Actor | Holds | Can |
|---|---|---|
| **Prover** | the private witness | choose to prove, or not |
| **Verifier contract** | public inputs + verification key | deterministically accept or reject |
| **Setup** | circuit-specific trusted setup (if any) | **critical trust assumption — must be documented per circuit** |

The gate proves **a predicate holds**, not **who the person is**.

## What this tool does **not** claim

| Not claimed | Why |
|---|---|
| That a ZK gate is deployed on Pi today | This repo is a probe and a design, not a deployment. |
| That BN254 / Poseidon are exposed through every Pi RPC surface | The probe measures what the RPC returns; the protocol capability lives inside Soroban contracts. |
| That any specific circuit is secure | Circuit design and trusted setup are out of scope. |

## See also

- `pi-nft-provenance` — who created a token, and when
- `pi-soroban-events` — walk events with measured coverage
- `pi-contract-upgrade-trail` — track `wasmHash` changes across deployments
