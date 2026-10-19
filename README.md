# Pi ZK NFT Gate

A **read-only capability probe** and **design document** for zero-knowledge-gated NFT access on Pi Network.

> **Plainly:** Pi Protocol v25 introduced **BN254 + Poseidon** zero-knowledge
> primitives for privacy-preserving smart contracts. This tool **probes what the
> current Pi RPC actually exposes** for ZK-related capabilities and **documents
> the design** of a gate that grants access on proof of a predicate without
> revealing the underlying identity.
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
node zk-gate.mjs --probe                 # probe the testnet RPC (read-only)
node zk-gate.mjs --probe --offline       # show the method list, no network
node zk-gate.mjs --probe --rpc <url>     # target another endpoint
node zk-gate.mjs --design                # print the design document
```

No install. No API keys. No writes.

## Measured RPC surface (2026-10-19, protocol 28)

| Method | Result |
|---|---|
| `getHealth` | OK — includes `ledgerRetentionWindow: 120960` |
| `getNetwork` | OK — passphrase `Pi Testnet`, protocol 28 |
| `getLatestLedger` | OK |
| `getLedgers` | OK (needs a `startLedger` inside retention) |
| `getEvents` | OK — `endLedger` is **exclusive**; filters accept only `system` / `contract` |
| `getTransactions` | OK |
| `getFeeStats` | OK — `sorobanInclusionFee` min/mode/max all `100000` |
| `getTransaction` | OK — unknown hashes return `status: NOT_FOUND` |
| `getLedger` | **method not found** |
| `getContractData` | **method not found** |

No method in the probe list takes or verifies a ZK proof. ZK capabilities are
exercised **inside Soroban contracts**, not through the RPC surface.

**Mainnet:** there is no public Soroban RPC. `rpc.mainnet.minepi.com` and
`soroban-rpc.mainnet.minepi.com` both answer **HTTP 503** and serve a certificate
that expired 2023-05-30. `api.mainnet.minepi.com` is REST (Horizon), not
JSON-RPC. The tool refuses `--probe --network mainnet` unless `--rpc` is given.

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
| That BN254 / Poseidon are exposed through the RPC surface | The probe measures what the RPC returns; the capability lives inside Soroban contracts. |
| That any specific circuit is secure | Circuit design and trusted setup are out of scope. |
| That the method list is permanent | It is an observation on 2026-10-19 and may change; re-run the probe. |

## Tests

```bash
node --test test.mjs
```

12 checks, all offline (`--probe --offline` skips every network call):

- `--help` lists both modes; no mode exits `1`
- `--design` prints the goal, predicate, witness, proof, verifier contract,
  trust boundary, and the `does NOT claim` section
- `--probe --offline` emits no network request and still prints the surface
  notice (`No ZK / proof-verification method appears in the RPC method set above.`)
- all ten probe methods are listed as `not probed (offline)`
- the offline probe never claims a ZK method exists
- `--probe --network mainnet` without `--rpc` refuses with the measured 503
  reason and exits `2`
- `--probe --offline --network mainnet` exits `0` and reports no endpoint
- the default endpoint is the measured testnet RPC
- the method-set caveats (`getLedger` / `getContractData` missing, exclusive
  `endLedger`, no Mainnet RPC) are printed verbatim

## See also

- `pi-nft-provenance` — read a transaction, its ledger, operations and effects
- `pi-soroban-events` — walk contract events with measured truncation
- `pi-contract-upgrade-trail` — track `wasmHash` changes across deployments
