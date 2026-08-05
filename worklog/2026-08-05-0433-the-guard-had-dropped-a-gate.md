# Worklog: the guard against dropped gates had dropped a gate

Date: 2026-08-05T04:33:03Z (generated filename)
Thread: corpus-integrity.mjs, built last turn, wired to nothing

## The fifth unreachable mechanism

I built `corpus-integrity.mjs` and connected it to nothing. That is the
**fifth** time this session — after the outbox, the corpus counts, the search
indexes, and the search itself.

Unlike the others, I have a gate for this now. `audit-verify-chain.mjs` exists
to catch a gate that is present in `scripts/` and absent from the chain.

**It reported 0 findings.**

## Why it missed

Its `EXPECTED` set was a **hand-written array of five paths**. A guard against
dropped gates that only knows the gates someone remembered to declare has
exactly the silent-coverage gap it exists to close — and a hand-maintained list
drifts on every addition, quietly, forever.

## Derived instead

The discriminator is `--strict`, this repo's convention for *exit non-zero on
findings*. It selects **4** scripts.

I rejected the naive rule — *any script with a non-zero exit* — which selects
**20**, twelve of them exiting on **usage** errors (`ia-ingest` with no args,
`search-library` with no query). Those are not gates.

The derived guard flagged `corpus-integrity.mjs` on its first run. Resolved by
**wiring the gate in**, not by silencing the finding. Chain: **8 → 9**.

## A failure mode I checked before accepting it

The corpus lives on external storage. An unmounted vault would make this gate
exit **70** and block **every push** — a failure that is not a defect. Confirmed
by pointing `CORPUS_DB` at a missing file.

Now it skips with exit 0 **and prints that it skipped**:

```
vault absent                    exit 0   "skipped: true … NOT a pass"
vault present, duplicate        exit 5
```

A skipped check that says nothing is indistinguishable from one that passed.

Verify exit 0. Suites 3 pass, 0 fail. Chain: 9 gates, 0 findings.
