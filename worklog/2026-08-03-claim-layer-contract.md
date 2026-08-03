# Worklog: claim layer contract

Date: 2026-08-03
Thread: GQ-009
Proposal: `proposals/2026-08-03-claim-layer-contract.md`

## What changed

Added the first registry-facing claim packet contract for question-driven answers:

- `schemas/claim-packet-v1.schema.json`
- `examples/valid-claim-packet.json`
- `examples/invalid-claim-packet.json`
- `scripts/verify-claim-packets.mjs`
- `package.json` with `npm run verify`

The contract keeps the Library out of two traps:

1. It does not warehouse corpus text; grounding stores selected quotes and locators only.
2. It does not execute work; action stores status and artifact pointers only.

## Before / after numbers

Measured in `sisodias/siso-librarian` on 2026-08-03.

| Measurement | Before | After |
| --- | ---: | ---: |
| tracked files | 1 | 1 tracked / 6 untracked before commit |
| proposals | 0 | 1 |
| worklogs | 0 | 1 |
| metrics files | 0 | 0 |
| schema files | 0 | 1 |
| claim-named files | 0 | 5 |
| JSON fixtures | 0 | 2 |
| local verifier | no | yes |
| verifier result | n/a | 2 fixtures checked: 1 valid accepted, 1 invalid rejected with 13 schema errors |

Verification command:

```bash
npm run verify
```

Observed output:

```text
claim packet verifier: 2 fixture(s), 1 valid fixture(s), 1 invalid fixture(s)
- examples/invalid-claim-packet.json: ok (13 schema error(s))
- examples/valid-claim-packet.json: ok (0 schema error(s))
```

## Repository/corpus confirmation attempted

Local availability check on 2026-08-03:

- `siso-book-library`: not found locally within `/Users/shaansisodia` maxdepth 4
- `siso-people-graph`: not found locally within `/Users/shaansisodia` maxdepth 4
- `siso-foundry`: not found locally within `/Users/shaansisodia` maxdepth 4
- `great-library-of-siso`: not found locally within `/Users/shaansisodia` maxdepth 4
- `~/passages.sqlite`: present, 23G; not opened or mutated
- `/Volumes/SISO-STORAGE-VAULT`: mounted, 4.5Ti size, 3.8Ti available

I did not re-measure the packet's upstream repo counts because the four repos were not present locally in the searched paths. I preserved the packet's provided measurements as user-provided state rather than claiming fresh confirmation.

## What I got wrong / what surprised me

The proposal file already existed when this loop continued, but its promised verifier and fixtures did not. The highest-value work was finishing the smallest testable contract rather than starting a second proposal.

I also expected AJV to be installed because `package.json` named it as a dev dependency, but `node_modules/ajv` was absent. To avoid spending the loop on dependency install, I wrote a narrow local verifier that checks the subset of JSON Schema used by this contract.
