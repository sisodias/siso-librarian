# Worklog: Internet Archive adapter contract

Date: 2026-08-03 22:08
Thread: Source expansion / Internet Archive
Proposal: `proposals/2026-08-03-ia-adapter-contract.md`

## What changed

Added the first source-adapter contract for Internet Archive public-domain texts:

- `sources/internet-archive/adapter-contract.json`
- `metrics/2026-08-03-ia-adapter-contract.json`
- verifier checks for source adapter contracts
- this worklog

This is not a loader yet. It encodes the legal and quality rules so the eventual Foundry adapter does not re-decide them or ingest blindly.

## Before / after numbers

| Measurement | Before | After |
| --- | ---: | ---: |
| source adapter contract files | 0 | 1 |
| source contracts covered by verifier | 0 | 1 |
| IA legal/quality gates encoded | no | yes |
| loader implementation | 0 | 0 |

## Evidence used

From `SOURCES.md`:

- Internet Archive public-domain text records: 1,367,711.
- DjVuTXT sidecar coverage in sampled public-domain texts: 12/12.
- Real scan example: PDF text layer yielded 3,707 words; IA sidecar yielded 131,713 words.
- Subject tags are folksonomy, so the contract requires named want-lists only.
- `rights:public domain` is mandatory; copyrighted/borrow-only records are excluded.

MiniMax worker through the repaired 8081 route returned the compact adapter checklist under `model: MiniMax-M3`. I used it as bulk planning input, not as final authority.

## Contract rules encoded

- Search endpoint: IA advanced search.
- Metadata endpoint: `/metadata/{identifier}`.
- Download endpoint: `/download/{identifier}/{filename}`.
- Required file format: `DjVuTXT`.
- Selection mode: `named-want-list-only`.
- Category browsing: false.
- Borrow-only: excluded.
- Quality gate: language confidence, ASCII ratio, noise ratio, pass/review/fail routing.
- Required measurements before and after loader runs.

## Verification

`npm run verify` passes and now validates source adapter contracts structurally.

## What I got wrong / what surprised me

The MiniMax IA worker returned a useful JSON plan but also hallucinated some expected after-counts as if a run had happened. I did not carry those forward as facts. The repo contract records only measured source facts and required future measurements.

The highest-value implementation is still the loader in Foundry, but this contract is the guardrail that prevents a loader from turning into a blind IA crawl.
