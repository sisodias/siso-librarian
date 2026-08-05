# Worklog: the Library reaches 298 books

Date: 2026-08-05T05:37:23Z (generated filename)
Thread: a third want-list

## Selection, probed before building

| subject | Library holds | IA has |
| --- | ---: | ---: |
| Medicine — History | 15 | **124** |
| Philosophy — History | 15 | 22 |
| Women — Education | 19 | 9 |
| Folklore — Ireland | 19 | **0** |

Irish folklore returned **zero** and was dropped before building anything.
**Thin in the Library does not mean available on IA** — that is the second time
probing first has saved a wasted list.

## Result

**119 of 119 eligible identifiers fetched.** First pass 115 ok, 4 `BAD_BODY`;
all four recovered on retry at 9 KB to 2,608 KB.

Across **three** want-lists now — 78/78, 101/101, 119/119 — **every failure has
been transient truncation and not one book has ever actually been unavailable.**
The `BAD_BODY` guard is what keeps a truncation from being written as a book.

## A third rights profile

```
list 1    72 formal-designation of 81
list 2    84 institutional-review of 111
list 3   115 formal-designation of 120
```

Same gate, three different mixes of evidence.

## The corpus

| | today's start | now |
| --- | ---: | ---: |
| books | 78 | **298** |
| passages | 122,553 | **318,290** |
| catalogued words | 11.5M | **31.6M** |
| headings | 11,260 | **22,321** |
| long-s passages | 49,710 | **108,775** |

Integrity at 298: **0 exact duplicates, 3 shared passages** — unchanged from 179.
The title dedup holds across three independent lists.

`book` stayed unchanged, verified after the write. Search finds **Philip Syng
Physick** in the new medical-history material; `zxqwvblorptik` still returns
nothing.

Verify exit 0.
