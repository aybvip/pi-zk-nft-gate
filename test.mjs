import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CLI = join(HERE, "zk-gate.mjs");

function run(args) {
  try {
    const out = execFileSync(process.execPath, [CLI, ...args], { encoding: "utf8", stdio: "pipe" });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: (e.stdout ?? "") + (e.stderr ?? "") };
  }
}

test("--help exits 0 and lists both modes", () => {
  const r = run(["--help"]);
  assert.equal(r.code, 0);
  assert.match(r.out, /--probe/);
  assert.match(r.out, /--design/);
});

test("no mode exits 1", () => {
  assert.equal(run([]).code, 1);
});

test("--design prints the design document", () => {
  const r = run(["--design"]);
  assert.equal(r.code, 0);
  assert.match(r.out, /ZK-Gated NFT Access/);
  assert.match(r.out, /Predicate/);
  assert.match(r.out, /Witness/);
  assert.match(r.out, /Proof/);
  assert.match(r.out, /Verifier contract/);
});

test("--design names the trust boundary explicitly", () => {
  const r = run(["--design"]);
  assert.match(r.out, /Trust boundary/);
  assert.match(r.out, /trusted setup/);
});

test("--design states the negative claims explicitly", () => {
  const r = run(["--design"]);
  assert.match(r.out, /does NOT claim/i);
  assert.match(r.out, /deployed on Pi today/);
});

test("--probe --offline performs no network call and still prints the surface note", () => {
  const r = run(["--probe", "--offline"]);
  assert.equal(r.code, 0);
  assert.match(r.out, /offline/);
  assert.match(r.out, /ZK-specific surface/);
  assert.match(r.out, /No ZK \/ proof-verification method appears/i);
});

test("--probe --offline lists every probe method as not probed", () => {
  const r = run(["--probe", "--offline"]);
  for (const m of [
    "getHealth",
    "getNetwork",
    "getLatestLedger",
    "getLedgers",
    "getEvents",
    "getTransactions",
    "getFeeStats",
    "getTransaction",
    "getLedger",
    "getContractData",
  ]) {
    assert.match(r.out, new RegExp(`${m}: not probed`), `missing ${m}`);
  }
});

test("--probe --offline never claims a ZK method exists", () => {
  const r = run(["--probe", "--offline"]);
  assert.doesNotMatch(r.out, /verifyProof: OK|zkVerify: OK/);
});

test("--probe --offline --network mainnet exits 0 and reports no endpoint", () => {
  const r = run(["--probe", "--offline", "--network", "mainnet"]);
  assert.equal(r.code, 0);
  assert.match(r.out, /none — offline/);
});

test("--probe --network mainnet without --rpc refuses with a measured reason", () => {
  const r = run(["--probe", "--network", "mainnet"]);
  assert.equal(r.code, 2);
  assert.match(r.out, /HTTP 503/);
  assert.match(r.out, /not a Soroban RPC/);
});

test("--probe --offline defaults to the measured testnet endpoint", () => {
  const r = run(["--probe", "--offline"]);
  assert.match(r.out, /rpc\.testnet\.minepi\.com/);
});

test("--probe --offline documents the measured method-set caveats", () => {
  const r = run(["--probe", "--offline"]);
  assert.match(r.out, /getLedger and getContractData are NOT implemented/);
  assert.match(r.out, /endLedger is exclusive/);
  assert.match(r.out, /no public Soroban RPC on Mainnet/);
});
