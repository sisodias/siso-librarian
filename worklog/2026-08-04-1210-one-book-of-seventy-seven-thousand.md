# Worklog: one book of seventy-seven thousand

Date: 2026-08-04T12:10:47Z (generated filename)
Thread: the one-row discrepancy

## Pulling the thread

`passage_summary` held 77,539 rows against the passage index's 77,540 book
bodies. I said that was worth pulling before assuming the file was derived.

The missing row is **gid 4715**:

```
book_body     gid 4715   body_start 1083   body_end 1091   passages 0
passage       gid 4715   0 rows
catalogue     "An African Millionaire: Episodes in the Life of the
               Illustrious Colonel Clay"  —  Allen, Grant, 1848-1899
text_url      https://www.gutenberg.org/ebooks/4715.txt.utf-8
rights        public_domain_us
```

**8 bytes of body and zero passages.** The summary is correct to omit it — the
reverse check confirms 0 summary rows lack a book body.

So the discrepancy is not a defect in the summary. It is an **extraction
failure**, isolated to one real book with a valid public URL and clean rights.

## Scope, before calling it isolated

```
books with zero passages          1
books with body under 100 bytes   2
total                        77,540
```

One in 77,540. Worth recording precisely rather than as "a book failed" — the
value of the number is that it bounds the problem.

## A stronger check than row parity

```
sum(passage_count) in summary   41,501,325
passage index row count         41,501,325
```

The rollup's total independently equals the index. Row parity would have passed
with wrong per-book values; the sum would not.

## What I did not do

Re-run extraction for gid 4715. The source is still public and addressable, so
it is recoverable — but writing to the passage index is touching Shaan's corpus,
and C6 says do not disturb it without copying first. A one-book gap does not
justify that. Recorded, with the URL, so it takes one command whenever someone
decides to.

| Measurement | Value |
| --- | ---: |
| discrepancy | 1 row, **explained** |
| books with zero passages | 1 of 77,540 |
| extraction success | 99.999% |
| verified vault backups | 6 -> **7** |

Verify exit 0.

## Two databases left unopened-for-backup

`intents.db` (10,269 intents, 4,919 spawns) and `foundry_usage_ledger.db`
(60,369 rows) are agent-operations data rather than Library data. I have opened
both and recorded their contents; neither is backed up. Given this session's
record — two ranking proxies failed, twice I found the valuable thing in the
file I had deprioritised — I am not going to assert they do not matter.
