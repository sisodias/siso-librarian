# Worklog: the limit that turned out to be real

Date: 2026-08-04T18:45:02Z (generated filename)
Thread: the 22.6 GB passage index, recorded as unverifiable twice

## I expected to be wrong again

This morning I recorded four vault databases as "too slow to check over USB"
and the real cause was my unbounded pragma — `quick_check(1)` cleared three of
them in seconds. So when the same phrase attached to the 22.6 GB passage index,
the obvious hypothesis was that I had made the same mistake twice.

I had not. Measured today:

```
pragma quick_check          does not return
pragma quick_check(1)       does not return
pragma integrity_check(1)   killed at 300s, rc=143, no output
```

**The bound limits errors REPORTED, not pages SCANNED.** All 5,921,286 pages
are walked either way. On a 5.4 GB file that finishes in seconds; on this one it
does not finish at all. The disagreement was a hypothesis about the checker, and
this time the checker was innocent.

## What is affordable, and why

The distinction that matters is index descent versus table scan:

| Check | Time |
| --- | ---: |
| schema, 10 objects | 0.026s |
| three b-trees readable | <1s |
| **nine bands, 18,333 rows, vs live** | **1.2s** |
| `min(rowid), max(rowid)` | **4m37s** |

`rowid BETWEEN` descends the primary key and touches only the leaves it needs.
`min()/max()` and `count(*)` walk the table. **The fix for a slow check is
usually an index-shaped query, not a smaller bound** — that is the general
lesson, and it is the one I missed this morning by reaching for a smaller bound
first and getting lucky.

## The result

Nine bands spanning rowid 1 to 41,501,325, compared against the live index on
count, chars, words and preview length: **9 of 9 identical, 18,333 rows.**
Schema intact, all three b-trees (`passage`, the FTS index, `book_body`)
readable, and descent to both the first and last leaf confirmed.

## What this is not

**0.0442% of rows.** Corruption in a page outside those bands passes silently.

This is a **structural probe**, not an integrity check, and it does not make the
index "verified" — I have now written that word into the script itself so the
next person cannot quietly upgrade it. With the pre-existing 250,005-row banded
checksum, the vault copy has strong *content* evidence and no whole-file
*structural* guarantee. At this size over USB that residual is permanent.

Now part of `npm run vault:verify`; exit 10 if the schema or any b-tree fails
to read. Verify exit 0.
