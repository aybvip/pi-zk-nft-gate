#!/usr/bin/env node
/**
 * Pi ZK NFT Gate — capability probe + design scaffold.
 *
 * Pi Protocol v25+ introduced BN254 + Poseidon zero-knowledge primitives for
 * privacy-preserving smart contracts. This tool probes what the current Pi
 * Testnet RPC actually exposes for ZK-related capabilities, and documents the
 * design of an NFT gate that grants access on proof of a predicate (e.g. "KYC'd
 * before date X") without revealing the underlying identity.
 *
 * The probe is GET-only and read-only. The design section is a document, not
 * an assertion that the feature is live.
 *
 * Usage:
 *   node zk-gate.mjs --probe            probe live capabilities
 *   node zk-gate.mjs --design           print the design document
 */

import { parseArgs } from "node:util";

const RPCS = {
  testnet: "https://rpc.testnet.minepi.com",
  // MEASURED 2026-10-19: no public Soroban JSON-RPC exists on Pi Mainnet.
  // rpc.mainnet.minepi.com and soroban-rpc.mainnet.minepi.com both answer
  // HTTP 503 and serve a certificate that expired 2023-05-30.
  // api.mainnet.minepi.com is a REST (Horizon) API, not JSON-RPC.
  mainnet: null,
};

async function rpc(rpcUrl, method, params = {}) {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) return { __httpError: res.status };
  const j = await res.json();
  if (j.error) return { __error: j.error.message || "RPC error" };
  return j.result;
}

function usage() {
  console.log(
    [
      "Pi ZK NFT Gate",
      "",
      "  node zk-gate.mjs --probe [--network testnet]            probe live RPC surface",
      "  node zk-gate.mjs --probe --offline                      probe layout, no network",
      "  node zk-gate.mjs --probe --rpc <url>                     target another endpoint",
      "  node zk-gate.mjs --design                               print the design document",
    ].join("\n")
  );
}

const { values } = parseArgs({
  options: {
    probe: { type: "boolean", default: false },
    design: { type: "boolean", default: false },
    network: { type: "string", default: "testnet" },
    rpc: { type: "string" },
    offline: { type: "boolean", default: false },
    help: { type: "boolean", default: false },
  },
});

if (values.help || (!values.probe && !values.design)) {
  usage();
  process.exit(values.help ? 0 : 1);
}

const network = values.network === "mainnet" ? "mainnet" : "testnet";
const rpcUrl = values.rpc ?? RPCS[network];

if (values.probe && !rpcUrl && !values.offline) {
  console.error(
    [
      `ERROR: no public Soroban RPC is known for network "${network}".`,
      "",
      "Measured 2026-10-19:",
      "  rpc.mainnet.minepi.com        -> HTTP 503 (no healthy backend)",
      "  soroban-rpc.mainnet.minepi.com -> HTTP 503 (no healthy backend)",
      "  both serve a certificate that expired 2023-05-30",
      "",
      "api.mainnet.minepi.com is a REST (Horizon) API, not a Soroban RPC.",
      "Use --rpc <url> to target another endpoint, or --network testnet.",
    ].join("\n")
  );
  process.exit(2);
}

const DESIGN = `
# ZK-Gated NFT Access — design

## Goal
Grant access to content or an NFT's utility when a user satisfies a predicate,
**without revealing the underlying identity**. Example: "prove you completed
KYC before 2026-02-20" without sending a name, document, or account ID.

## Why Pi
Pi Protocol v25 introduced **BN254 + Poseidon** zero-knowledge primitives for
privacy-preserving smart contracts. Pi Network also operates a large-scale KYC
infrastructure. The combination makes a ZK gate a natural fit: the verifier
checks a proof, not a document.

## Components
1. **Predicate**: the statement to prove (e.g. "KYC'd before date X", "holds
   token Y since ledger Z"). Must be expressible as an arithmetic circuit over
   the supported field.
2. **Witness**: private inputs the prover holds (identity, timestamps, keys).
3. **Proof**: a succinct argument (BN254) that the witness satisfies the
   predicate. Published on-chain or off-chain with a public commitment.
4. **Verifier contract**: a Soroban contract that checks the proof against a
   public input and a stored verification key, then grants or revokes access.

## Trust boundary
- The **prover** holds the witness and can choose not to prove.
- The **verifier contract** is deterministic and public.
- The **setup** (if any circuit-specific trusted setup is used) is the critical
  trust assumption and must be documented per circuit.
- The gate proves **a predicate holds**, not **who the person is**.

## What this tool does NOT claim
- That a ZK gate is deployed on Pi today.
- That BN254 / Poseidon are exposed through every Pi RPC surface.
- That any specific circuit is secure. Circuit design and trusted setup are
  out of scope here.
`;

(async () => {
  if (values.design) {
    console.log(DESIGN.trim());
    process.exit(0);
  }

  console.log("# Pi ZK NFT Gate — capability probe");
  console.log(`network: ${network}`);
  console.log(`rpc:     ${rpcUrl ?? "(none — offline)"}`);
  console.log("");

  if (values.offline) {
    console.log("(--offline: network probes skipped; method list follows)");
    console.log("");
  }

  // A valid ledger range is required: startLedger below the retention floor is
  // a hard error, and endLedger is exclusive (measured 2026-10-19).
  let oldest = null;
  if (!values.offline) {
    const h = await rpc(rpcUrl, "getHealth");
    if (h && h.oldestLedger !== undefined) {
      oldest = Number(h.oldestLedger);
      console.log(`retention: oldest=${h.oldestLedger} latest=${h.latestLedger}`);
      console.log("");
    }
  }

  const ZERO_HASH = "0".repeat(64);
  const probes = [
    ["getHealth", {}],
    ["getNetwork", {}],
    ["getLatestLedger", {}],
    ["getLedgers", oldest === null ? null : { startLedger: oldest, limit: 1 }],
    ["getEvents", oldest === null ? null : { startLedger: oldest, endLedger: oldest + 1, filters: [], limit: 1 }],
    ["getTransactions", oldest === null ? null : { startLedger: oldest, limit: 1 }],
    ["getFeeStats", {}],
    ["getTransaction", { hash: ZERO_HASH }],
    // Negative controls: these are expected NOT to exist on this RPC.
    ["getLedger", { ledgerSeq: oldest ?? 1 }],
    ["getContractData", { contractId: "C" + "A".repeat(55) }],
  ];

  for (const [method, params] of probes) {
    if (values.offline) {
      console.log(`  ${method}: not probed (offline)`);
      continue;
    }
    if (params === null) {
      console.log(`  ${method}: skipped (no retention bounds available)`);
      continue;
    }
    const r = await rpc(rpcUrl, method, params);
    if (r && r.__httpError) {
      console.log(`  ${method}: HTTP ${r.__httpError}`);
    } else if (r && r.__error) {
      console.log(`  ${method}: RPC error — ${r.__error}`);
    } else {
      const keys = r && typeof r === "object" ? Object.keys(r).slice(0, 8).join(",") : typeof r;
      console.log(`  ${method}: OK — keys: ${keys}`);
    }
  }

  console.log("");
  console.log("# ZK-specific surface");
  console.log(
    "No ZK / proof-verification method appears in the RPC method set above."
  );
  console.log(
    "ZK capabilities (BN254, Poseidon) are introduced at the protocol level (v25+)"
  );
  console.log(
    "and are exercised from inside Soroban contracts, not from the RPC surface."
  );
  console.log(
    "This probe therefore reports what the RPC exposes, not what the protocol supports."
  );
  console.log("");
  console.log("# Method-set caveat (measured 2026-10-19)");
  console.log("  - getLedger and getContractData are NOT implemented ('method not found').");
  console.log("  - getEvents accepts only filter types 'system' and 'contract'.");
  console.log("  - getEvents endLedger is exclusive: [L, L] returns nothing.");
  console.log("  - There is no public Soroban RPC on Mainnet (HTTP 503).");
  console.log("");
  console.log("# Next");
  console.log("Run with --design for the full design document.");
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
