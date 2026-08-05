# Worklog: 777 books, and the scans that made every gate slow

Date: 2026-08-05T12:58:54Z (generated filename)
Thread: completing the fifth want-list

## The Library

| | |
| --- | ---: |
| books | **777** |
| passages | **981,260** |
| words | **88.6M** |
| long-s passages | 160,175 |

**443 of 443 eligible fetched.** Across five want-lists every failure has been
transient — not one book permanently unavailable.

## Two crashes, one recovery

The modern-spelling index died at **940,000 of 981,260**. Measured:

```
offset 1,000     6ms
offset 900,000   27,273ms      a 4,500x degradation
rowid range      19ms          a 1,435x speedup
```

`limit/offset` makes sqlite walk every skipped row. Switched to rowid ranges.

It died **again** near the end — an **unbounded word cache** keyed on every
f-containing word across 88.6M words, where OCR garbage supplies effectively
unlimited variety. Bounded at 200k entries, plus `--resume` so a crash does not
throw away an hour.

The crash left a **5.6 MB rollback journal** that blocked read-only opens.
Opening writable let sqlite replay it: **454,000 rows preserved, no data loss.**

## A guard that checked the wrong thing

The pipeline verified `passage_modern` **exists** — not that it is complete. It
reported success holding **334,000 of 981,260 rows**, and `long_s_passages`
would have been published as **53,517**: a count that *fell* while the corpus
grew. Exactly the number a reader would trust.

It now compares row counts and exits 1 on a mismatch. **Presence is not
completeness** — I added that check to the passage index earlier in this same
run and missed it one step later.

## The scans

```
count(*) from passage_ext                39,755ms
count(*) where heading is not null      197,863ms
sum(words)                              195,793ms
count(*) from passage_modern where …    did not return in 5 minutes
max(rowid)                                   19ms
```

Those ran in `search --stats`, `build-library-page`, `build-observatory`
**and three declared derivations the audit re-runs on every gate invocation.**
That is what pushed `npm run verify` past ten minutes.

The builders already compute every one of these numbers. They now persist them:

| | before | after |
| --- | ---: | ---: |
| `search --stats` | 506s | **0s** |
| observatory build | — | 26s |
| `npm run verify` | timeout | **418s** |

Numbers identical. **The fix for a slow query is an index-shaped query or a
stored aggregate — never a smaller batch.** Third time this session.

Suites 4 pass, 0 fail.
