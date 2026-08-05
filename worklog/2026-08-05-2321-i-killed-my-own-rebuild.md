# Worklog: I killed my own rebuild 40 minutes in

## What I did

Started a 200-book fetch while a rebuild was running, reasoning that the
remaining stages only **read** the index.

Wrong. The modern-spelling build holds a long **write** transaction over 2.59M
rows, and the ingester writes to the same database:

```
Runtime error near line 1: database is locked (5)
modern index failed
```

Forty minutes of indexing, gone. The cost was time, not data — the passage index
had already completed (1,725 books, 2,593,708 passages, intact).

## The asymmetry that hid it

`--check` **already** detects an in-flight fetch, by watching whether the text
count is still moving. The **rebuild path never did** — and the rebuild path is
the half that actually loses work. The cheap read-only report was guarded; the
40-minute write was not.

## The fix

`refuse_if_ingesting` at start-up **and** immediately before step 3. Both,
because the failure case was an ingest started *after* the rebuild began, which
a start-up-only check would wave through. Step 3 is the last moment before the
long write transaction, so it is the last moment the answer is still cheap.

| case | result |
| --- | --- |
| fake `ia-ingest.mjs` running | **exit 11**, REFUSING printed |
| none running | clean, guard passes |

## A second slip I caught

`ps aux \| grep -c '[i]a-ingest'` returned 1 and I briefly believed an ingest was
still running. It was counting **its own pipeline**. Confirmed the truth by
checking whether the fetch log was still growing — 13,926 bytes, unchanged over
20 seconds.

## Corpus

**1,925 books, 2,916,805 passages, 231.7M words.** The rebuild finished clean,
with the OCR-skip branch firing correctly:

```
catalogue 1925, index 1924 — 1 book(s) yielded no usable paragraphs (OCR noise)
```
