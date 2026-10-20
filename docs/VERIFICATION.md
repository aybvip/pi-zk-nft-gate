# Verification — pi-zk-nft-gate

Two things are checked, and they are separate: the **probe's behaviour** (offline,
deterministic) and the **RPC surface** (measured, and therefore dated).

## Offline: the test suite

```bash
git clone https://github.com/aybvip/pi-zk-nft-gate
cd pi-zk-nft-gate
node --test test.mjs
```

Expected result: **12 pass, 0 fail**. The suite uses `--probe --offline`, so it
opens **no socket**.

What the 12 checks cover:

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
- the default endpoint is the measured Testnet RPC
- the method-set caveats (`getLedger` / `getContractData` missing, exclusive
  `endLedger`, no Mainnet RPC) are printed verbatim

## Live: the probe

```bash
node zk-gate.mjs --probe
```

This is the only command that opens a socket. It calls `getHealth`, `getNetwork`,
`getLatestLedger`, `getLedgers`, `getEvents`, `getTransactions`, `getFeeStats`,
`getTransaction`, `getLedger` and `getContractData`, and reports each as `OK` or
`method not found`. It reads only; it never writes, signs or submits.

## What a passing run does and does not show

- A passing suite shows the **probe's behaviour** is as specified: the modes, the
  offline path, the refusals, the printed caveats.
- A successful live probe shows the **RPC answered** — or did not — for each
  method at that time. It says nothing about the future method set, and the tool
  tells you to re-probe rather than trust the recorded list.
- Neither shows that a ZK gate exists, that any circuit is secure, or that the
  designed system has been deployed. Those are explicitly outside the tool.

## Reproducibility note

No digest or signature is attached to these results, and none is claimed. A
digest would prove integrity, not truth, and a signature would require naming an
authority this project does not have. What is offered instead is a command whose
outcome anyone can recompute.
