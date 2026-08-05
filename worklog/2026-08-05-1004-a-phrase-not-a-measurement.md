# Worklog: "the residual is permanent" was a phrase, not a measurement

Date: 2026-08-05T10:04:23Z (generated filename)
Thread: the 22.6 GB passage index

## What held, and what did not

**Held:** `pragma integrity_check` still cannot finish over USB — killed at 45
seconds with no output. That limit is real.

**Did not hold:** *"cannot run a full integrity check"* is not *"cannot
verify"*. I had been treating one pragma's limit as the whole story and
repeating "permanent residual" for two days.

## Measured instead

```
schema read          4ms
head 200,000 rows    16,466ms
tail 201,326 rows    18,344ms
```

| | rows | coverage |
| --- | ---: | ---: |
| bands only | 250,000 | 0.60% |
| **with endpoints** | **651,331** | **1.57%** |

Nearly triple, for about 35 seconds. And **1.57% is a very different claim from
"unverified"** — the verifier now prints it on every run.

## A bug in my own edit

I set `passage_ok=0` when an endpoint is unreadable — and a later line
**reassigns `passage_ok` from the band result alone**. An unreadable endpoint
would have reported success.

Caught by reading the order of the assignments rather than trusting the edit. It
now uses a separate `endpoints_ok` flag, and both conditions must hold.

## The fifth want-list is complete

**443 of 443 eligible fetched.** Every failure across five want-lists has been
transient — not one book permanently unavailable.

*"The travels of Sig. Pietro della Valle"* fetched correctly, which is the
Italian filter's two-marker threshold doing exactly its job: sparing an English
book that carries an Italian name.

## And a collision the gates found

`npm run verify` exited 1 with **"database is locked (5)"** while the
background rebuild held a write lock. A gate failing because another process is
mid-write reports a defect that does not exist.

`corpus-integrity` now reports `skipped: true` with the reason and an
explicit **"NOT a pass"** — reproduced live against the running rebuild.
