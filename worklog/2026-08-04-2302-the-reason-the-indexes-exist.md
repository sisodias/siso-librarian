# Worklog: the reason the indexes exist

Date: 2026-08-04T23:02:47Z (generated filename)
Thread: two indexes, no readers

## Third instance of the same defect today

I built a 122,553-passage index. Then a modern-spelling index that roughly
doubles recall on 18th-century text. **Nothing read either of them.** Both were
reachable only by someone who knew the vault path and wrote their own SQL.

Same shape as the outbox holding three undelivered messages, and the corpus
counts absent from the page that reports the corpus. Content exists; nothing
surfaces it.

`npm run library:search`.

## Three bugs, each found by running it

**`snippet()` inside `json_group_array`** — *"unable to use function snippet
in the requested context"*. FTS5 auxiliary functions only work in the query that
owns the MATCH. Fixed by computing the snippet in a subquery and aggregating
outside.

**Every result came from the printed index.** Concatenating printed-then-modern
fills the entire page from the first one. Interleaving is necessary — and **not
sufficient**.

**Still all printed after interleaving.** Both indexes match the *same rows*
first, so dedup discards the modern duplicates before reaching any modern-only
hit. The fix is to ask the modern index only for passages the printed index
**cannot** find, excluded in SQL.

That third one is the whole point: **1,963 passages containing "himfelf" are
findable only through the modern index.** Without it the recall gain I measured
last turn would sit in a table and never reach a reader.

## Verified

```
"parliament AND debate"  -> a 1742 London Magazine debate
"himself"                -> Miscellanies passages whose printed text reads "himfelf"
"zxqwvblorptik"          -> no matches (searched: printed + modernised)
```

The empty case names **which indexes were consulted**, so "not found" cannot be
mistaken for "not searched".

| | |
| --- | ---: |
| books | 78 |
| passages | 122,553 |
| words | 9,826,621 |
| with headings | 122,414 |
| long-s passages | 49,710 |

Verify exit 0.
