# Worklog: the age-settled grade, verified on its first batch

The `age-settled` grade admitted **538 pre-1929 books** the rights filter had been
rejecting on metadata wording. This is the first batch fetched under it.

```
189/200 fetched, 58.2 MB
```

Eleven failures — a lower rate than usual, and **every one graded
`age-settled`**. That looked like the new grade admitting bad items.

## What they actually are

```
NO_TEXT:   William Cheyney Letter to son 1891-04-06
NO_TEXT:   William Cheyney Letter to son 1892-12-23
BAD_BODY:  William Cheyney Letter to son, Letter #2 1891-08-04
```

**All 11 are manuscript letters** — handwritten items with no OCR text layer,
rejected by the `NO_TEXT` and `BAD_BODY` guards that predate this change.

**143 `age-settled` books succeeded** in the same batch.

## Verdict

The grade works. The failure rate is a property of handwritten material in an
archive of scanned books, not of the rights decision — and it was caught by
existing guards rather than reaching the corpus.

Worth noting the shape: "all 11 failures share the new attribute" is exactly the
kind of correlation that reads as causation. Checking *what the failures were*
rather than *what they had in common* is what separated the two.

**3,461 texts on disk.**
