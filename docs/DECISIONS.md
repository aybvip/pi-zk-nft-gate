# Design decisions — pi-zk-nft-gate

## D1 — Probe and design in one repository, kept apart

**Reasoning:** the question "can I build a ZK gate on Pi?" has two halves with
different statuses. *What the RPC exposes* is measurable today. *How a gate would
be built* is a design, and designs are not measurements.

**Decision:** the tool has two modes, `--probe` and `--design`, and neither
borrows the other's authority. The probe reports measurements; the design is
printed as a document. The README, this file, and `BOUNDARIES.md` all state which
is which.

## D2 — Report the RPC surface as measured, not as documented

**Reasoning:** Pi's protocol notes introduce BN254 + Poseidon primitives, which
invites the conclusion that the RPC "supports ZK". It does not follow: the
primitives are exercised inside contracts, not through RPC methods.

**Decision:** the probe enumerates the ten methods it knows and reports each as
`OK` or `method not found`, then states plainly that **no method in the probe
list takes or verifies a ZK proof**. The boundary between "protocol supports it"
and "RPC exposes it" is printed, not left for the reader to guess.

## D3 — Never claim a deployment

**Decision:** neither mode asserts that a ZK gate exists on Pi. The design is a
scaffold: goal, predicate, witness, proof, verifier contract, trust boundary. A
reader is told it is a plan at every level (README, `--design` output,
`BOUNDARIES.md`).

## D4 — Make the trust boundary explicit

**Decision:** `--design` prints a trust-boundary section naming the three actors —
prover (holds the witness, can choose not to prove), verifier contract
(deterministic and public), and setup (the critical trust assumption if a
circuit-specific trusted setup is used) — and states that the gate proves **a
predicate holds**, not **who the person is**. A ZK design whose trust assumptions
are implicit is not reviewable.

## D5 — `--offline` so the probe is testable without a network

**Reasoning:** a probe whose output depends on RPC availability cannot be verified
deterministically.

**Decision:** `--probe --offline` prints the method list as
`not probed (offline)` and makes no request, so the probe's structure, its
caveats, and its refusal behaviour can be checked with no network. By design it
never claims a ZK method exists while offline.

## D6 — Refuse Mainnet without an explicit endpoint

**Measurement:** `rpc.mainnet.minepi.com` and `soroban-rpc.mainnet.minepi.com`
answer HTTP 503 and serve a certificate that expired 2023-05-30;
`api.mainnet.minepi.com` is REST (Horizon), not JSON-RPC.

**Decision:** `--probe --network mainnet` without `--rpc` refuses with that
measured reason and exits `2`, rather than failing with a transport error.
`--rpc <url>` targets any endpoint, including one that appears later.
