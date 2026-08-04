# Worklog: every vault database was unverifiable

Date: 2026-08-04T10:12:55Z (generated filename)
Thread: the last six skips, and what testing them exposed

## The skips, tested

**`if (!added) continue`** — a worklog with no add-commit drops out of the
timestamp check entirely, which is the one way a fabricated timestamp could
escape the gate built to catch fabricated timestamps. Checked all 97: every one
has an add-commit, so it is genuinely inert *today*. Now reports instead of
vanishing.

**`if (!cf.endsWith('.json')) continue`** — a claim under any other extension is
excluded from the grounded-evidence set. Dropped one in as `.json.bak`:

```
checks_skipped: 0
any stray finding: NONE — invisible
```

And `.json.bak` is precisely what my own backup habit creates before an edit.
Now reports; proven to fire and to stay quiet on a clean repo.

## What the fixes uncovered

Clearing those made two pre-existing findings visible, both consequences of my
own moves — and one of them was much larger than a stale path.

**`rows_in_vault_snapshot` reported `unavailable`.** The file existed, the path
was right. The failure was the *query*:

```
sqlite3 "file:<vault>.db?mode=ro"                -> unable to open database file (14)
sqlite3 "file:<vault>.db?mode=ro&immutable=1"    -> 2261
```

`mode=ro` alone fails on the vault because SQLite still wants WAL/shm sidecars
beside the file and the external volume refuses. **Every archived database on the
vault was unverifiable** — reported as "unavailable" rather than as a hole in
coverage, so the passage index, the gateway log archives, and anything else I
have vaulted were all outside the audit.

Fixed with `immutable=1` **for `/Volumes/` paths only**. That flag is right for
archives — snapshots nothing writes to — and wrong for live databases, where it
would let the audit read a stale page and agree with a number that has moved.

**A false positive of my own making.** `derivation-source-missing` flagged
GQ-004's `documented_path_exists`, whose *entire finding* is that the documented
package is not installed. The check was reporting the finding as a defect —
exactly the cry-wolf pattern that gets gates disabled. Now skipped for
`file-exists`, where absence is the measurement.

Also: a metrics file still pointed at the bifrost archive I moved to
`superseded/` last loop, and two scripts were unreferenced. `snapshot-paths.mjs`
is a library, not a command; `probe-ia-metadata.mjs` is superseded by
`npm run ia:probe` but kept, because a live claim grounds in the metrics it
produced and deleting the producer of cited evidence is worse than an
unreferenced file. Both documented rather than deleted.

| Measurement | Before | After |
| --- | ---: | ---: |
| skips verified (of 12) | 6 | **8** |
| declared derivations re-derived | 26 | **28** |
| vault databases the audit could verify | **0** | all |
| findings on a clean repo | 6 | 2 (historical drift + info) |

Verify exit 0; self-test 12/12.

## Four skips left

Two `continue`s inside a walk over files that do not exist, one on a metrics file
that vanished between listing and reading, one on a non-object JSON document.

I said "genuinely nothing to check" about eleven and was wrong about one, then
about six and was wrong about two. The pattern is that my reasoning is roughly
right and specifically unreliable — so the honest report is 8 verified, 4 not,
rather than any claim about what the remaining four are.
