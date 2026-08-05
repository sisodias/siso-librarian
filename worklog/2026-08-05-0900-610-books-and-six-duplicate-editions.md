# Worklog: 610 books, and six duplicate editions title matching cannot see

Date: 2026-08-05T09:00:18Z (generated filename)
Thread: the second bounded batch

## The Library

| | |
| --- | ---: |
| books | **610** |
| passages | **756,622** |
| words | **67.2M** |
| exact title duplicates | 0 |

Served page confirms 610. Catalogue and index agree — the pipeline's own guard.

## Every failure is still transient

144 of 150 first pass, **8/8 on retry** — including `b21500253`, which had
failed three times last turn at 170 bytes against a declared 1,008,087. It
fetched cleanly this time.

**Five want-lists, and not one book has ever been permanently unavailable.**

## Six duplicate editions

The shared-passage count jumped, so I read the pairs rather than accepting it:

```
876  "The world of wonders"  /  "The wonders of the universe"
319  Natural history of Selborne  /  Natural history of Selborne. Observations...
```

The first pair share **identical prefaces** — the same Victorian compilation
reissued under a different name. The second is two editions of Gilbert White
with different subtitles.

**Title dedup cannot catch these.** The titles are genuinely different strings;
only the text reveals it. `corpus-integrity` now reports pairs sharing more
than 50 passages as `duplicate_edition_candidates`, with counts.

**Not deleted.** Which edition a library keeps is a curation decision, and both
are legitimately public domain.

## A borderline language flag, investigated

`Musaeum Tradescantianum` (1656) scored **0.406** — just under the 0.45
threshold. It is an **English catalogue with Latin verse front matter**, not a
foreign book.

The flag is correct and the book belongs. **That is precisely why the language
check reports instead of excluding.**

## An operational note

The full rebuild now exceeds a ten-minute foreground call and must run in the
background. The corpus has outgrown a synchronous rebuild.

Verify exit 0. Suites 4 pass, 0 fail.
