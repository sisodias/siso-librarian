# Proposal: add schemas for portfolio and refresh ledger

Date: 2026-08-03
Thread: GQ-009

## Gap

The claim packet has a JSON Schema, but the two registry control surfaces built after it — `questions/portfolio.json` and `refresh/ledger.json` — are only checked by hand-written verifier logic. That makes the claim layer harder to compose: the packet contract is explicit, while the portfolio and freshness contracts are implicit in code.

The next highest-value claim-layer gap is contract hardening, not another feature. A visible question system needs stable shapes for the question index and refresh ledger before more claim packets accumulate.

## Evidence

Measured before this change:

- proposals: 3
- worklogs: 3
- metrics files: 2
- schema files: 1
- question portfolio schema: 0
- refresh ledger schema: 0
- `npm run verify`: pass; checks portfolio and refresh ledger with custom logic only

Machine health before work:

- `/`: 27Gi available
- load averages: 1.34 / 1.15 / 1.37

The charter requires measurement before/after and says the claim layer remains the top gap. The people-graph enrichment log has already been read in this session and graph-enrich duplication remains explicitly out of scope.

## Proposal

Add two JSON Schemas:

1. `schemas/question-portfolio-v1.schema.json`
2. `schemas/refresh-ledger-v1.schema.json`

Then wire the verifier to validate `questions/portfolio.json` and `refresh/ledger.json` against those schemas before doing cross-file referential checks.

## Measurement expected to move

- schema files: 1 -> 3
- portfolio schema: 0 -> 1
- refresh ledger schema: 0 -> 1
- verifier scope: custom portfolio/refresh checks -> schema validation plus referential checks

## What would prove this wrong

If the schemas only duplicate comments and do not catch malformed structure before referential checks run, this is not worth carrying. The test is that the verifier uses the same schema validator for all three registry contracts.

## Non-goals

- Do not install dependencies.
- Do not run corpus extraction.
- Do not mutate passages, people graph, foundry canonical DBs, or vault corpus.
- Do not duplicate graph-enrich loaders.
