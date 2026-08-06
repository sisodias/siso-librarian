# Worklog: the served page searched titles; the CLI searched 3.1 million passages

Having just spent a long stretch making the search CLI correct and fast, I
checked what a reader on the **web page** actually gets.

```html
<input id="q" placeholder="Search titles and chapter headings…">
```

Titles and headings. `library.html` is a **10.5 MB static file** with no backend,
so it cannot query the 3,135,554-passage corpus at all.

That is the same defect the search CLI was written to fix — *"the content
existed, nothing surfaced it"* — one layer up. I fixed it for the terminal and
left the web reader with a title index.

## Why it was cheap

A server already runs: `com.siso.librarian-observatory`, **32 lines**, serving
`public/` on 8765. This is an endpoint, not infrastructure.

`/search` **delegates to `search-library.mjs`** rather than copying its SQL. That
exclusion logic took four failed attempts to get right — rowid join, per-term
LIKE, candidate cap — and a second copy would drift from it silently.

## A defect the adversarial test found

```
GET /search?q='; drop table book_ext;--
```

The database was **never at risk**: the connection is `mode=ro`, FTS5 rejected
the string as invalid grammar, and `book_ext` still holds 2,124 rows. But the
CLI **died with a Node stack trace** instead of saying what was wrong.

A search tool that crashes on a stray quote tells the reader nothing. Now:

```
not a valid search expression: syntax error near "'"
FTS5 syntax: bare words, "quoted phrases", AND / OR / NOT, NEAR(a b).
```

exit **65** (`EX_DATAERR`), which the endpoint maps to **HTTP 400** — distinct
from 500 (failure) and 504 (timeout). Three outcomes, three codes: a reader's
typo is not a server fault, and a timeout is not an empty result.

## Verified

| case | result |
| --- | --- |
| valid query | **200** |
| stopword "the" | **200** in 3s |
| malformed | **400** with the exact reason |
| missing `q` | **400** |
| static `library.html` | **200** |
| path traversal | **404** |

## A false alarm I chased

One 400 came back as 500 and I nearly rewrote the handler. It was a **stale
server process** — confirmed by inspecting `err.status` directly (65, exactly as
designed) before changing any code.

## Corpus

The seventh want-list is exhausted: **1,119 of 1,121 eligible books on vault**,
**2,812 texts on disk**.
