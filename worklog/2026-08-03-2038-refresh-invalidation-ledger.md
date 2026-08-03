# Worklog: refresh and invalidation ledger

Date: 2026-08-03 20:38
Thread: GQ-009
Proposal: `proposals/2026-08-03-refresh-invalidation-ledger.md`

## What changed

Added the first explicit freshness surface for claim packets:

- `refresh/ledger.json` records refresh checks for production claim packets.
- `scripts/verify-claim-packets.mjs` now checks that every production claim packet has a refresh ledger entry.
- `metrics/2026-08-03-refresh-invalidation-ledger.json` records machine-readable before/after numbers.

This turns "continuously updated" from a field inside the claim packet into an external invariant: a production claim packet cannot pass verification unless the registry says when it was checked and whether it is fresh, stale, or blocked.

## Before / after numbers

Measured in `sisodias/siso-librarian` on 2026-08-03.

| Measurement | Before | After |
| --- | ---: | ---: |
| proposals | 2 | 3 |
| worklogs | 2 | 3 |
| metrics files | 1 | 2 |
| schemas | 1 | 1 |
| production claim packets | 1 | 1 |
| portfolio files | 1 | 1 |
| refresh/invalidation files | 0 | 1 |
| refresh ledger entries | 0 | 1 |
| production claims with refresh coverage | 0 | 1 |
| verifier scope | claim + portfolio checks | claim + portfolio + refresh coverage checks |

Machine health before work:

- `/`: 23Gi available
- load averages: 3.13 / 3.73 / 3.40

Verification command:

```bash
npm run verify
```

Observed output:

```text
claim packet verifier: 2 fixture(s), 1 valid fixture(s), 1 invalid fixture(s), 1 listed claim packet(s)
- examples/invalid-claim-packet.json: ok (13 schema error(s))
- examples/valid-claim-packet.json: ok (0 schema error(s))
- claims/GQ-009-claim-layer-contract.claim.json: ok (0 schema error(s))
question portfolio: ok (1 listed claim packet(s))
refresh ledger: ok (1 covered claim packet(s))
```

## Evidence read first

Read `CHARTER.md`. The charter replaced the earlier brief and explicitly permits self-improvement, lean MiniMax bulk work, and charter edits when warranted. It also requires ~30 minute progress reports and reiterates that extraction must be question-driven.

Read `siso-foundry/docs/PEOPLE-GRAPH-ENRICHMENT-LOG.md` through GitHub before selecting work. The shipped people-graph loaders and negative cross-domain stitch result make graph-enrich duplication the wrong move.

## What I got wrong / what surprised me

The refresh ledger is small, but it adds a real invariant. Before this loop, a claim could contain refresh intent while still being operationally abandoned. After this loop, orphaned freshness state fails verification.

I did not need the lean MiniMax lane for this loop because the work was surgical and judgement-heavy, not bulk mechanical classification.
