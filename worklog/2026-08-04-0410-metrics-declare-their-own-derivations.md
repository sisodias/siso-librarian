# Worklog: metrics declare their own derivations

Date: 2026-08-04 04:10 UTC (from `date -u`)
Thread: verification of asserted values

## The rot I was building

The previous loop's JSONL check listed specific totals inside the auditor. It worked, and it was the wrong shape: every new artifact would need a hand-edit to that script to be covered. A verification step that requires manual registration is one that silently stops covering new work — which is exactly how most of this repo's numbers went unchecked in the first place.

So the auditor now knows nothing. It scans `metrics/*.json`, finds any file carrying a `derivations` block, resolves each dotted path against that file's own contents, and re-runs the stated derivation. Adding a checkable number means declaring it where the number lives, not editing the checker.

Supported kinds: `sqlite`, `jsonl-sum`, `jsonl-count`, `file-bytes`, plus the existing `file-count` and `json-length`.

## Backfilled, and what it caught

Four files now declare derivations, giving **9 independently re-derived values**, all agreeing:

| File | Values | Source |
| --- | ---: | --- |
| cached-minimax-runner | 4 | raw runner JSONL |
| awesome-signal-canonical-promotion | 2 | canonical people graph |
| passage-index-vault-backup | 2 | both copies of the 23G file |
| minimax-claims-with-derivations | 1 | Bifrost logs.db |

The passage-index entry is the one I care about most: it re-checks that the source and vault copies are both still exactly 24,253,587,456 bytes, on every `npm run verify`. Bit-rot or a truncated vault copy now surfaces during routine verification rather than the day someone needs the backup.

Proved it fails correctly: setting `curated_awesome` to `12345` was caught as `derived 90209, delta 77864`, `--strict` exited 3, and restoring returned 9 clean re-derivations.

## Honest accounting of coverage

| Measurement | Value |
| --- | ---: |
| metrics files in repo | 20 |
| files declaring derivations | 4 |
| values re-derived per verify | 23 (14 snapshot + 9 declared) |
| gates in `npm run verify` | 3 |

Four of twenty. The other sixteen are not wrong — most record point-in-time observations that no longer have a live source, which is a different thing from unverified. But I should not let 23 green checks imply the repo is covered. It means the numbers that *can* be re-derived now are, and each new artifact can opt in by declaring rather than by someone remembering.

## What this does not fix

The declaration and the value are still written by the same process in the same breath. If I compute a number wrongly and declare a derivation that reproduces the same wrong computation, both agree and the check passes. What it defends against is the failure that actually happened — a number typed by hand, or one that drifted after its source moved — because value and source are now compared by separate code paths at a later time.

That is a narrower guarantee than "these numbers are correct", and worth stating as such.
