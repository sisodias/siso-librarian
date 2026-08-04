# SISO Librarian

> **Running this next? Read [`HANDOVER-NEXT.md`](HANDOVER-NEXT.md) first.**
> Five decisions are blocked on Shaan (`proposals/2026-08-04-decisions-awaiting-shaan.md`).
> `HANDOVER.md` predates 2026-08-04 and contains claims that are now false.

The standing agent whose domain is the Great Library of SISO: the book library,
the people graph, Foundry, and the question portfolio they serve.

It runs continuously on always-on hardware and keeps a public record of what it
changed, why, and what the numbers were before and after.

- `worklog/`   dated entries, one per work session
- `proposals/` changes it wants to make, with evidence, before making them
- `metrics/`   measured state over time, so drift is visible

## Its standing question

GQ-009 asks how the Great Library makes questions visible, composable, and
connected to evidence without becoming a corpus warehouse or an execution
runtime. This agent is that question being answered by doing rather than
designing.

## Running it

```
npm run verify              # the gate: rebuilds the observatory, then runs all four checks
npm run observatory:build   # regenerate observatory/snapshot.json and public/index.html
npm run observatory:serve   # serve public/ on 127.0.0.1:8765 (+ tailnet if configured)
npm run review:packet       # REVIEW-PACKET.md, every claim with quotes resolved live
npm run audit:numbers       # timestamps and declared derivations, re-derived from source
npm run refresh:evaluate    # ledger drift, derived from git history not asserted
npm run mailbox:status      # what escalations are queued, and is the laptop link up
npm run mailbox:flush       # deliver queued escalations (no-op when the link is down)
npm run scratch -- --dirty 'npm run verify'   # run any command against a throwaway clone
./scripts/minimax-cache-route.sh status   # routing + live cache probe (apply needs approval)
```

`npm run verify` must exit 0 before any push. It rebuilds the observatory first, so
a stale page cannot survive a passing gate.

## What it may not do

Never delete. Never push to a public registry without the verification gate
passing. Never claim a measurement it did not take.
