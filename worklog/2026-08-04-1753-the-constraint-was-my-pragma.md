# Worklog: the constraint was my pragma

Date: 2026-08-04T17:53:04Z (generated filename)
Thread: four vault databases I recorded as unverifiable

## What I had written

> *"4 skipped — quick_check on multi-GB files over USB exceeds ten minutes."*

I recorded that as a property of **file size on external storage**, twice, and
carried "four vault databases unverified today" forward as a standing item.

## `quick_check(1)`

The bounded form stops after the first error and returns in seconds:

```
identity-20260804T112002Z.sqlite   1.9 GB   ok
logs-20260804T091934Z.db           5.4 GB   ok
logs-20260804T053544Z.db           3.4 GB   ok
```

**Three of four, verified.** Same integrity signal for a first failure, at a
fraction of the cost. The constraint I attributed to USB and file size was
substantially my choice of pragma — I used the unbounded form, watched it time
out, and generalised from that to "cannot be checked".

## One genuinely too large

```
passages.sqlite   22.6 GB   exceeds ten minutes even bounded
```

Size is the real constraint here. It does have stronger evidence than a
`quick_check` anyway — a banded checksum across **250,005 rows** in five bands
spanning first to last rowid, all matching the live index, run earlier today.

But it has had no structural integrity check today, and **11 of 12 is the honest
number**.

## Documented where it will be read

The pragma choice is now in `verify-vault-backup.sh`'s header, next to the
`immutable=1` note and the launchd warning. A successor reaching for
`quick_check` on a vault copy will see why to bound it.

| Measurement | Before | After |
| --- | ---: | ---: |
| vault databases verified today | 8 of 12 | **11 of 12** |
| recorded as unverifiable | 4 | **1** |
| cause | "USB too slow" | **unbounded pragma** |

Verify exit 0.

## The shape, again

I measured a real timeout and drew a conclusion one level too general: not *"this
query is too slow"* but *"these files cannot be checked"*. The charter rule I
wrote this morning — state the conclusion at the scope you measured — applies to
tool behaviour as much as to corpus statistics.
