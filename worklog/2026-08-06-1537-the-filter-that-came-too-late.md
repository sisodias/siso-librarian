# Worklog: the selection filter did not remove what had already been fetched

I added a correspondence filter to `build-want-list` and moved on. Then I checked
whether the 13 manuscript letters already on the vault were affected.

They were not. **`build-external-passages` reads the text DIRECTORY**, not the
want-list — so those 13 would enter the index on the next rebuild regardless of
what the selection filter says.

Verified they are not indexed *yet*: **0 Cheyney books, 0 passages** in the
current index. The last rebuild predates that fetch. The window was still open.

## The fix

The builder now skips the same pattern at index time, counts it separately in
`corpus_stats`, and `rebuild-corpus` adds **both** skip categories when
reconciling the catalogue against the index — otherwise the reconciliation
reports a mismatch that is not one.

**Nothing is deleted.** The files stay on the vault; they are simply not indexed.

## A hardcoded path that bit immediately

My first fixture test reported **0 correspondence skipped**. The builder read the
catalogue from a hardcoded path, so it took titles from the **real** catalogue
instead of the fixture — and the fixture had no rows, so no title matched.

Seven other builders had already been moved to `lib/vault-paths.mjs` for exactly
this reason. This one was missed, and the miss surfaced the moment I tried to
test something.

`BOOKS_DB` override added. That is what made the skip testable at all.

## A number that would have misled me later

The builder logged **"from 5 books"** while indexing 2. `rebuild-corpus` greps
that line, and a count like that reads as a corpus size in a worklog a week
later.

```
64 passages, 1,799 words, from 2 books (3 correspondence skipped)
```

## Verified

| | |
| --- | --- |
| fixture: 3 letters + 2 books | 3 skipped, `books=2`, 64 passages |
| files still on disk | **5** — nothing deleted |
| verify chain | exit 0 |
