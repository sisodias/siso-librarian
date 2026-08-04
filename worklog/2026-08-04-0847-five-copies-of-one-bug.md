# Worklog: five copies of one bug

Date: 2026-08-04T08:47:34Z (generated filename)
Thread: the prefix mismatch I kept re-encountering

## Root cause, finally

Five times this session the same defect, most recently **inside the script
written to hunt it**:

```
source_inventories vs source-inventories  -> reported 0 of 6
person_content vs person_topic            -> nearly refuted a true claim
snap.bucket_counts[g][k] hardcoded        -> repo_health.* audited nothing
bucket_counts. prefix vs bare key         -> reported 42 undeclared, true 24
the same prefix bug, in collision analysis-> every group read as null
```

I had been treating these as five mistakes. They are **one mistake made five
times**, and the cause is structural: path resolution was hand-rolled at every
call site. Three implementations existed — two in the audit, one in the
sensitivity script — so fixing one left the others wrong, and **each wrong copy
agreed with itself rather than erroring**.

`scripts/lib/snapshot-paths.mjs` is now the only implementation. Tested against
six cases including the one that bit me twice: an already-prefixed path must not
be double-prefixed.

## Consolidating found a number nobody was checking

The refactor was supposed to change nothing. It changed two things:

```
counts re-derived   35 -> 37
mismatches           0 ->  1
```

`repo_health.scripts_on_disk` asserted **17**, derived **18**. The old resolver
had been failing to resolve it at all, so it was skipped silently and never
compared. Consolidation did not create the disagreement — it **revealed** one
that had been invisible.

The cause was mundane: I added `scripts/lib/` this loop, making 18 files. But
the number had been unchecked for however long, and the only reason I found it
is that I stopped re-implementing the lookup.

Two labels went from skipped to checked. I do not know how long they were
skipped, and the audit cannot tell me — a skipped check leaves no trace, which
is the whole problem with silent skips.

## A guard for the guard

If `resolveLabel` ever stops resolving, every declared derivation is skipped and
the audit reports success having checked nothing. Self-test case 9 breaks the
resolver deliberately and requires the audit to notice — it does, surfacing as
all 48 numbers suddenly undeclared rather than a quiet pass.

| Measurement | Before | After |
| --- | ---: | ---: |
| path-resolution implementations | 3 | **1** |
| counts independently re-derived | 35 | **37** |
| numbers silently skipped by the resolver | 2 (invisible) | 0 |
| gate self-test cases | 9 | **10** |

Self-test 10/10; verify exit 0.

## What this does and does not fix

It removes the *class*: there is now one place to get path resolution wrong, and
a test that fires if it breaks. It does **not** mean I stop making the
underlying error — I made it again this loop, in the collision analysis, before
consolidating. The fix is that a sixth instance now has one place to live and a
gate watching that place.

The wrong-source half of the four-times defect remains uncovered, unchanged from
last loop.
