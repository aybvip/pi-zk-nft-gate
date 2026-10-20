# What this repository does **not** claim

This repository is unusual in that it holds two kinds of output at once: a
**measurement** (the RPC probe) and a **design** (a document). The boundary below
keeps a reader from mistaking one for the other.

| Not claimed | Why |
|---|---|
| That a ZK gate is **deployed** on Pi today | This repo is a probe and a design, not a deployment. |
| That BN254 / Poseidon are exposed through the **RPC surface** | The probe measures what the RPC returns. The ZK capability lives **inside Soroban contracts**, not in the RPC method set. |
| That any specific **circuit** is secure | Circuit design and trusted setup are out of scope. |
| That the method list is **permanent** | It is an observation on 2026-10-19 and may change. Re-run the probe. |
| That the design is **adoptable as-is** | It is a scaffold. A real deployment would settle the circuit, the setup and the verifier contract, none of which is built here. |
| That KYC status is **provable without disclosure** in Pi's current form | The design targets that property; it does not assert the tooling exists today. |
| That this is the first such design | The prior-art position is **"no prior work found"**, not "we are first". |
| That Pi Network has adopted, reviewed or endorsed this | Adoption is **not-claimed**. |

## The line between probe and design

- **Probe** (measured) — the tool calls the live RPC and reports which methods
  respond and which return `method not found`. This is dated and re-checkable.
- **Design** (documented) — the tool prints a written design: predicate, witness,
  proof, verifier contract, trust boundary. It is a plan, and it is labelled as
  one.

The probe explicitly reports that **no method in the list takes or verifies a ZK
proof**. That is the whole reason a design document is needed: the capability is
not reachable through the surface a naive reader would probe, so the design says
where it actually lives.
