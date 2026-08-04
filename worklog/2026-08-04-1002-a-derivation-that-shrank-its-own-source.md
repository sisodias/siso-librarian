# Worklog: a derivation that shrank its own source

Date: 2026-08-04T10:02:48Z (generated filename)
Thread: testing the eleven skips instead of reasoning about them

## Why testing, not reading

Last loop my reasoning cleared eleven skips and the one I actually tested — the
one my reasoning had cleared — turned out to be real. So I tested more.

## The finding

Corrupt one release file in the registry, then run the audit:

```
checks_skipped: 0
metric-count findings: 0
```

**Nothing.** The `json-join-count` derivations skipped the bad file, measured a
smaller registry, and agreed with themselves. No mismatch, no finding, no
skipped-check count.

Worse than invisible: `file-count` over the *same directory* still counts the
corrupt file. So two derivations reading one directory would report different
sizes, and neither would say so. A registry could rot one file at a time while
every gate stayed green.

Three sites had the same swallow — `json-join-count` (twice),
`json-status-count`, and `json-predicate-count`. The last would have shrunk
`claims_live` without a word.

## The fix

Throw instead of `continue`/`return false`. `derive()` already turns a throw into
a null, and the caller already reports null as an **unavailable** derivation:

```
release_integrity.works_referenced       asserted 25  derived unavailable  unverifiable
release_integrity.orphaned_releases      asserted  0  derived unavailable  unverifiable
release_integrity.works_without_releases asserted  0  derived unavailable  unverifiable
strict exit=3
```

"I could not measure this" is a completely different statement from "I measured
this and it agrees", and the machinery to say the first already existed — the
catch blocks were throwing the information away before it got there.

## A test that would have damaged what it tests

I first wrote this as a `check()` case. That helper backs up and restores **by
path**, and this case's target is the real registry *outside* the scratch copy —
so a failure mid-case would have left a corrupt registry file on disk.

Third time this session a test threatened the thing it was testing. Rewrote it
as an inline probe that restores unconditionally before reporting, and confirmed
after the run: **0 unparseable release files**.

| Measurement | Before | After |
| --- | ---: | ---: |
| swallowing catch sites in derivations | 4 | **0** |
| corrupt source file detected | no | **yes, 3 derivations report unavailable** |
| skips verified (of 12) | 2 | **6** |
| self-test cases + probes | 12 + 1 | **12 + 2** |

Verify exit 0; self-test 12/12; registry intact.

## What is left

Six skips still unverified: worklogs with no timestamp in the filename, non-JSON
files in claims/, a missing metrics file, and a git-log lookup returning empty.
Each looks like genuinely-nothing-to-check.

That is the same sentence I wrote last loop about eleven, and it was wrong about
one of them. The difference now is that I have halved the unverified set by
testing rather than by re-reading it.
