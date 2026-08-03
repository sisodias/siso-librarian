# Proposal: add a refresh and invalidation ledger

Date: 2026-08-03
Thread: GQ-009

## Gap

The claim layer now has valid claim packets and a visible question portfolio, but it still cannot show whether a claim is fresh, stale, or due for review. The packet contains refresh selectors and invalidation triggers; nothing records refresh checks against those triggers.

That leaves "continuously updated" as an intention rather than a measurable registry behavior.

## Evidence

Measured before this change:

- proposals: 2
- worklogs: 2
- metrics files: 1
- schemas: 1
- production claim packets: 1
- portfolio files: 1
- refresh/invalidation files: 0
- `npm run verify`: pass; validates 2 fixtures, 1 production claim, and 1 portfolio reference

Machine health before work:

- `/`: 23Gi available
- load averages: 3.13 / 3.73 / 3.40

Charter constraints read from `CHARTER.md`:

- Claim extraction must be question-driven; full extraction is arithmetically impossible.
- Report visible progress every ~30 minutes.
- Do not duplicate graph-enrich; cross-domain stitch is explicitly not a gap.

People-graph enrichment log read first. It records the shipped loaders and negative results, so this proposal stays within the claim layer.

## Proposal

Add a lightweight refresh ledger that records checks for production claim packets:

1. claim packet path
2. question id
3. checked timestamp
4. selectors used
5. invalidation triggers considered
6. result: fresh / stale / blocked
7. evidence note and next check

Extend the verifier so each production claim packet has at least one ledger entry and each ledger entry points to an existing portfolio-listed claim packet.

## Measurement expected to move

- refresh/invalidation files: 0 -> 1
- refresh ledger entries: 0 -> at least 1
- production claims with refresh coverage: 0 -> 1
- verifier scope: portfolio referential checks -> portfolio plus refresh coverage checks

## What would prove this wrong

If the first ledger entry merely duplicates data inside the claim packet and adds no independently checkable invariant, the ledger is premature. The invariant to test is: every production claim packet must have an explicit freshness state outside the packet itself.

## Non-goals

- Do not run extraction.
- Do not mutate `~/passages.sqlite`, `/tmp/people_v2_gh.sqlite`, canonical foundry DBs, or the vault corpus.
- Do not implement a scheduler or runtime queue.
- Do not add graph-enrich loaders.
