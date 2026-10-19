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
  mainnet: "https://api.mainnet.minepi.com",
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
      "  node zk-gate.mjs --probe [--network testnet|mainnet]   probe live ZK capabilities",
      "  node zk-gate.mjs --design                               print the design document",
    ].join("\n")
  );
}

const { values } = parseArgs({
  options: {
    probe: { type: "boolean", default: false },
    design: { type: "boolean", default: false },
    network: { type: "string", default: "testnet" },
    help: { type: "boolean", default: false },
  },
});

if (values.help || (!values.probe && !values.design)) {
  usage();
  process.exit(values.help ? 0 : 1);
}

const network = values.network === "mainnet" ? "mainnet" : "testnet";
const rpcUrl = RPCS[network];

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
  console.log(`rpc:     ${rpcUrl}`);
  console.log("");

  const probes = [
    ["getNetwork", {}],
    ["getLedgers", { startLedger: 1, limit: 1 }],
    ["getProtocolVersion", {}],
    ["getEvents", { startLedger: 1, endLedger: 2, filters: [], limit: 1 }],
    ["getTransaction", { hash: "0000000000000000000000000000000000000000000000000000000000000000" }],
  ];

  for (const [method, params] of probes) {
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
    "The Pi RPC does not currently expose a named ZK / proof-verification method."
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
  console.log("# Next");
  console.log("Run with --design for the full design document.");
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
