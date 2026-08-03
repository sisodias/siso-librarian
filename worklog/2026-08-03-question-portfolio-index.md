# Worklog: question portfolio index

Date: 2026-08-03
Thread: GQ-009
Proposal: `proposals/2026-08-03-question-portfolio-index.md`

## What changed

Added a visible question portfolio over the claim layer:

- `questions/portfolio.json` lists active questions, claim packets, evidence selectors, refresh triggers, and action status.
- `claims/GQ-009-claim-layer-contract.claim.json` promotes the first valid claim packet from fixture into a production claim packet.
- `scripts/verify-claim-packets.mjs` now validates production claim packets and checks that every production claim packet is listed by the portfolio.
- `metrics/2026-08-03-question-portfolio-index.json` records machine-readable before/after numbers for this loop.

This makes the claim layer visible and composable without becoming a corpus warehouse or execution runtime. The portfolio points to selected claim packets; it does not store corpus text or run extraction.

## Before / after numbers

Measured in `sisodias/siso-librarian` on 2026-08-03.

| Measurement | Before | After |
| --- | ---: | ---: |
| proposals | 1 | 2 |
| worklogs | 1 | 2 |
| metrics files | 0 | 1 |
| schemas | 1 | 1 |
| claim packet fixtures | 2 | 2 |
| production claim packets | 0 | 1 |
| question/portfolio index files | 0 | 1 |
| listed claim packets | 0 | 1 |
| verifier scope | standalone fixtures | fixtures + production claims + portfolio referential checks |

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
```

## Evidence read to avoid duplicate work

Read `siso-foundry/docs/PEOPLE-GRAPH-ENRICHMENT-LOG.md` through GitHub because `siso-foundry` was not present locally. Key constraints from that log:

- Graph-enrich has already shipped repo value/category, awesome-list, activity/liftability, and adoption signal loaders.
- The Gutenberg↔GitHub stitch was measured as structurally near-empty: plausible overlap ceiling ~419 people.
- Naive person↔person co-membership was measured and rejected at ~720M pairs.

Therefore this loop stayed in the claim layer and did not duplicate enrichment loaders.

## What I got wrong / what surprised me

My first verifier extension counted expected invalid-fixture schema errors as global unexpected errors. The fix was to validate each file into a per-file error sink, then only promote errors from production claim packets or unexpectedly passing/failing fixtures.

The portfolio immediately made a useful invariant obvious: production claim packets must not exist as orphan files. That is the right kind of registry constraint — small, mechanical, and evidence-adjacent.
