# Worklog: 36 files, one record

Date: 2026-08-04 04:55 UTC (from `date -u`)
Thread: Observatory — reading what I count

## The mistake I was repeating

Last loop I found a hyphen that had been hiding six source inventories, and in fixing it I added two directories to the page — `assemblies` and `snapshots` — without opening either. I put `snapshots: 36` on a card next to `works: 25` purely because `find` returned 36.

That is the same error in a new place: trusting a count of a directory I had never read.

## What is actually in there

Not 36 records. Thirty-six sequential versions of **one** whole-library snapshot, `v1` through `v36`, each superseding the last.

My first guess about *why* was also wrong. I assumed the filenames `whole-library-v1..v36` meant one record with 36 revisions sharing an id — but every file carries a distinct id, a distinct name, and a proper semver version. It took reading the names to see it: "Whole Library V1 — Agents Foundation", "V10 — Agent Br…", "V36 — Foundry Agency OS Coverage Inventory". A version series, authored 2026-07-29 through 2026-08-03, growing from 6 releases to 25.

Displaying that as a bucket count implies the registry holds 36 things. It holds one thing that has been revised 36 times.

## What the page shows now

`Library snapshot — v36 · 25 rel`, read from the highest-versioned file: **v36.0.0, "Foundry Agency OS Coverage Inventory", 25 releases, immutable, created 2026-08-03**. The file count survives as `snapshot_versions`, which is honest — it is history depth, not inventory size.

A cross-check worth keeping: the current snapshot references **25 releases** while the registry holds **75 release files**, and Works is **25**. That is consistent rather than contradictory — the snapshot pins the current release for each of the 25 Works, and the other 50 files are superseded versions. Two numbers that look like they should match, and shouldn't.

| Measurement | Before | After |
| --- | --- | --- |
| snapshots presented as | `snapshots: 36` (a bucket) | `v36 · 25 rel` (current state) |
| file count labelled | `snapshots` | `snapshot_versions` |
| snapshot contents read | never | version, name, releases, immutability |
| counts re-derived | 18 | 18 |
| sources existence-checked | 28 | 28 |

## The pattern, stated once

Three loops running, the same shape: a number that was structurally fine and semantically wrong. `source_inventories: 0` because of a path. `MiniMax route: verified` because of a stale string. `snapshots: 36` because I counted files without asking what a file *was*.

Re-derivation would have passed all three. The check that catches them is reading the thing — the directory listing, the log, the file contents. My verification machinery is good at "does this number still equal its source" and blind to "does this number mean what the label says". The second question needs comprehension, not arithmetic.

## Residual

`assemblies: 2` is still a count of files I have not opened. I am naming it rather than silently leaving it, and it is small enough that being wrong about it costs little — but it is the same unread bucket, and I should not pretend otherwise just because this loop happened to stop at snapshots.

The snapshot reader parses only the highest version. If a malformed file breaks parsing, it is skipped silently so the page still builds — which means a corrupt latest snapshot would show v35 without complaint. That is a deliberate trade for page availability, and worth revisiting if snapshots become load-bearing.
