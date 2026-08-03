# Proposal: add the claim layer contract

Date: 2026-08-03
Thread: GQ-009

## Gap

The Library has byte-addressable passages, inventories, releases, and people/content/topic graphs, but no registry-level contract for claims: answer-shaped units that connect a question to selected evidence and an approved next action.

Without this contract, question work either collapses downward into raw passages or upward into unverifiable narrative. Both violate GQ-009: the Library should make questions visible, composable, continuously updated, and connected to evidence/action without becoming the warehouse or runtime.

## Evidence

User-provided measured state for the broader system:

- `~/passages.sqlite`: 41,501,325 passages across 77,540 books.
- Extraction budget: ~187,500 passages total against a corpus that would require ~33,200M tokens for full extraction.
- Therefore exhaustive claim extraction is arithmetically impossible; claims must be question-driven and evidence-selected.

Measured state of `sisodias/siso-librarian` before this change:

- tracked files: 1
- proposals: 0
- worklogs: 0
- metrics files: 0
- schema files: 0
- claim-named files: 0
- local verify script: no `package.json`, so no `npm run verify` gate in this repo yet

## Proposal

Add a small public claim packet contract to this repo, plus example validation fixtures and a local verifier.

The contract should define only the registry-facing handoff, not corpus storage or runtime execution:

1. `question`: visible problem statement and stable ID.
2. `claim`: position, confidence, status, and timestamps.
3. `grounding`: one or more quotes with source locator, byte range, and passage ID where available.
4. `action`: approved/proposed action pointer and owner/status.
5. `refresh`: selectors and invalidation triggers so the claim can be continuously updated.
6. `provenance`: producing tool/run and model metadata.

## Measurement expected to move

- schema files: 0 -> 1+
- claim-named files: 0 -> 1+
- local verifier: no -> yes
- passing fixtures: 0 -> at least 1 valid and 1 intentionally invalid fixture checked by `npm run verify`

## Non-goals

- Do not read or mutate `~/passages.sqlite`.
- Do not copy corpus data into this repo.
- Do not implement extraction at corpus scale.
- Do not define a runtime queue or executor.
