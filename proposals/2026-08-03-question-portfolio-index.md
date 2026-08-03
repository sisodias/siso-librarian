# Proposal: add a question portfolio index

Date: 2026-08-03
Thread: GQ-009

## Gap

The claim packet contract now exists, but claim packets are still loose files. A reader can validate a single answer-shaped unit, but cannot yet see the visible question portfolio: which questions exist, which claims answer them, what evidence state they are in, and what approved/proposed action they point toward.

That is the next claim-layer hole. Without an index, questions are not composable or continuously updated; they are only individually valid.

## Evidence

Measured in `sisodias/siso-librarian` before this change:

- proposals: 1
- worklogs: 1
- metrics files: 0
- schemas: 1
- claim packet fixtures: 2
- question/portfolio index files: 0
- `npm run verify`: passes for 2 fixtures, but validates only standalone claim packet shape

External constraint from GQ-009 remains decisive: extraction does not scale. Therefore the Library needs a question-level control surface that selects evidence and tracks refresh status, not a warehouse-scale extraction queue.

People-graph enrichment is not duplicated here. `siso-foundry/docs/PEOPLE-GRAPH-ENRICHMENT-LOG.md` records 13 shipped loaders and the important negative result: Gutenberg↔GitHub stitching is structurally near-empty, with a measured theoretical ceiling of ~419 plausible overlap people. The next useful work in this repo is claim/question organization, not more graph loading.

## Proposal

Add a small question portfolio manifest plus verifier checks that every non-fixture claim packet is discoverable from that manifest.

The manifest should answer four registry-level questions:

1. What standing or derived question is visible?
2. Which claim packet currently answers it?
3. What evidence selectors and refresh triggers keep it current?
4. What action status is attached?

It should not store corpus text, run extraction, or duplicate people-graph enrichment.

## Measurement expected to move

- question/portfolio index files: 0 -> 1
- manifest-listed claim packets: 0 -> at least 1
- verifier scope: standalone packet validation -> packet validation plus manifest referential checks
- metrics files: 0 -> 1 snapshot with before/after counts

## Non-goals

- Do not mutate `~/passages.sqlite` or the vault corpus.
- Do not build a runtime queue.
- Do not add people-graph enrichment loaders.
- Do not solve contemporary corpus acquisition here.
