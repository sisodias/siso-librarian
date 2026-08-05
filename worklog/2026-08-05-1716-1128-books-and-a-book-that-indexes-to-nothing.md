# Worklog: 1,128 books, and one that indexes to nothing

Date: 2026-08-05T17:16:23Z (generated filename)
Thread: the sixth want-list, second batch

## The Library

| | |
| --- | ---: |
| books | **1,128** |
| passages | **1,635,000** |
| words | **137.0M** |
| long-s passages | 395,158 |

200 of 200 fetched. The Library has passed a thousand books.

## E2BIG, again

The rebuild stopped at step 1: **"migration failed"**. Cause was
`E2BIG` — 1,128 insert statements passed as a single argv exceeded the OS
limit. **Exactly the defect I fixed in `add-longs-variants` earlier by piping
SQL on stdin**, sitting in a script I had not scaled-tested.

The pipeline guard did its job: it refused to build an index on top of a failed
migration.

## A book that legitimately indexes to nothing

`b19602923` — 68,649 chars, **4,811 blocks, not one reaching 120 characters**,
opening `m m §s`. Pure scan noise. The builder logged
**"NO PARAGRAPHS — skipped"** and indexed nothing, which is correct.

But **both** completeness guards read the resulting one-book gap as a truncated
index. The catalogue says 1,128; the index holds 1,127; forever.

The builder now records `skipped_no_paragraphs` in `corpus_stats` and both
guards subtract it:

```
complete: 1127 indexed + 1 skipped (OCR noise) accounts for 1128 texts
```

**Not by widening the tolerance** — a guard that tolerates any gap stops
detecting a truncated index. The skip count makes the exception exact.

## And a masking bug I caught while adding it

To count skips I piped the builder through `tee`. **`cmd | tee` returns
tee's exit status**, so a failed index build would have passed silently — the
same shape as `|| true` swallowing a gate in the verify chain. Fixed with
`PIPESTATUS[0]`, verified: `false | tee` gives `PIPESTATUS[0]=1`.

Verify exit 0. Suites 4 pass, 0 fail.
