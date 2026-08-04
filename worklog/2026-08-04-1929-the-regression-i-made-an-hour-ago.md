# Worklog: the regression I made an hour ago

Date: 2026-08-04T19:29:37Z (generated filename)
Thread: what the new source broke

## Adding a source broke the thing that finds sources

An hour ago I added `book_external` and verified carefully that no existing
row moved. All true, and I checked the wrong thing.

Both dedup paths read `from book`:

```
build-want-list.mjs:39   select ... from book where title is not null
ia-title-dedup.mjs:42    select gid ... from book where title is not null
```

The next want-list run would have **re-offered all 78 books I had just
ingested** and refetched every one from archive.org.

The dangerous part is how it fails: no error, no exception, no empty result —
just 78 duplicates reported as fresh finds with full confidence, and a
volunteer-run archive asked twice for the same text. My post-write check asked
"did anything move?" when the question was "does anything still read only half
the catalogue?"

## Fixed, and proven with a control

Both queries now UNION `book_external`.

| Check | Result |
| --- | ---: |
| titles indexed, before | 74,674 |
| titles indexed, after | **74,752** (+78) |

```
"John Donne, his flight from mediaevalism"        -> ALREADY HELD  johndonnehisflig00molo
"The classical tradition in poetry"               -> ALREADY HELD  classicaltraditi00murr_1
"A Book That Does Not Exist In Any Library 99xyz" -> not held
```

The **negative case is the one that proves the fix**. A change that made
everything match would pass both positives just as happily. The nonsense title
still reporting "not held" is what shows the index still discriminates.

`ia-ingest --dry-run` now reports **"78 already on vault; 0 to fetch"**.

## A downstream case I did not force

The passage index keys on `gid INTEGER` too and holds 77,540 book bodies.
Passage-indexing the 78 new books needs exactly the synthetic-gid decision I
refused an hour ago. They stay unindexed, and I am writing that down rather
than solving it by inventing ids in a namespace that means something else.

Verify exit 0. Gate self-test: 13 passed, 0 failed.
