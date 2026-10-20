# Sources — pi-zk-nft-gate

Two kinds of source appear here, and they are labelled apart on purpose: a
**measured endpoint** and a **written design**.

## Source 1 — the live RPC (measured)

| Endpoint | Role | Measured 2026-10-19 |
|---|---|---|
| `https://rpc.testnet.minepi.com` | the endpoint the probe queries | works — protocol `28`, node `28.0.1`, retention `120960` |
| `rpc.mainnet.minepi.com` | attempted; the tool refuses to probe it | **HTTP 503**; certificate expired 2023-05-30 |
| `soroban-rpc.mainnet.minepi.com` | same as above | **HTTP 503** |
| `https://api.mainnet.minepi.com` | REST (Horizon), **not** JSON-RPC | works, but out of scope for a Soroban probe |

## The measured method set (2026-10-19, protocol 28)

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

No method in this list takes or verifies a ZK proof. This is the measurement that
forces the design to live inside Soroban contracts rather than on the RPC
surface.

## Source 2 — the design (a document)

The `--design` output is a document, not a measurement. It covers:

1. **Goal** — grant access when a user satisfies a predicate, without revealing
   the underlying identity.
2. **Predicate** — the statement to prove (e.g. "KYC'd before date X").
3. **Witness** — the private inputs the prover holds.
4. **Proof** — a succinct BN254 argument that the witness satisfies the
   predicate, published with a public commitment.
5. **Verifier contract** — a Soroban contract that checks the proof against a
   verification key.
6. **Trust boundary** — prover, verifier contract, and setup.

The protocol note that introduces BN254 + Poseidon is the *motivation* for the
design; the design itself is this repository's own.

## Re-checking everything

```bash
git clone https://github.com/aybvip/pi-zk-nft-gate
cd pi-zk-nft-gate
node --test test.mjs             # 12 offline checks (--probe --offline skips the network)
node zk-gate.mjs --probe         # live probe, read-only
node zk-gate.mjs --probe --offline
node zk-gate.mjs --design
```

## Provenance of the numbers

The measurements were taken on **2026-10-19** against the Testnet Soroban RPC at
protocol version **28**. Protocol version is read from `getNetwork` /
`getVersionInfo` at measurement time. No third-party mirror or blog is used as a
source; the method set is re-derivable by running the probe.
