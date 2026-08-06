# Worklog: the search over 3.1M passages took seven minutes for one word

The corpus grew 78 → 2,125 books today. The **interface** is the point of the
Library, and I had not measured it since a fraction of this size.

```
telescope                     61ms
the                       434042ms      <- seven minutes fourteen seconds
quinine                     8324ms
electromagnetic induction   1222ms
```

Raw FTS5 answers `the` in **333ms**. The other 433 seconds were mine.

## The cause

An unlimited `NOT IN` over a `MATCH` subquery. SQLite plans it as a
**LIST SUBQUERY**: materialise all **2,723,718** printed matches, then scan the
modern index against that list — to return three rows.

## Four attempts that failed, and what each taught

| attempt | result |
| --- | --- |
| bounded `NOT IN` window | fast but **wrong** — 4 duplicate passages at `--limit 8` |
| JS-side exact re-query of survivors | re-materialised the same posting list: 395ms → **231s** |
| `changed=1` pre-filter | **necessary but not sufficient** — a passage can be modernised elsewhere and still print the term literally; still 100s on "such" |
| per-row membership lookup | **one lookup costs 97 seconds** |

The last explains the rest. **`ext_id` and `seq` are `UNINDEXED` columns in the
FTS5 table**, so any filter on them still walks the entire posting list for the
term. There is no targeted lookup to be had at this schema. The base table
answers the same lookup in 93ms — but stores only offsets and a 160-char
preview, so it cannot test term membership.

## The curve is a cliff, not a line

```
quinine   4,036 hits ->    181ms
himself  35,469 hits ->  6,404ms
cause    46,157 hits -> 29,995ms
```

I first set the budget from an assumed ~1ms per 9,000 hits. Hit count **does not
predict cost**, so it now sits low — 10,000, inside the measured-fast region —
rather than at an extrapolated boundary I cannot defend.

## Result

| query | before | after |
| --- | ---: | ---: |
| the | 434,042ms | **551ms** |
| telescope | 581ms | 191ms |
| himfelf | 15,057ms | 60ms |

Every tested query under **600ms**, **0 duplicates** across eight queries.

## The honest tradeoff

Common words — `the`, `such`, `himself`, `cause` — now return **printed-only**
results and **say so**:

```
(modern-spelling index skipped: 198,400 printed matches exceeds the 10,000 budget
 for exact overlap exclusion — narrow the query to include it)
```

That is a real loss of long-s recall on exactly the words the index was built
for. I do not like it. But a **stated** loss beats a seven-minute query or a
silent duplicate, and the schema change that would fix it properly is a bigger
piece of work than this turn.

## A self-inflicted detour

My first fix put a **backtick inside a template-literal comment** and broke the
whole script — every query returned 0 hits in 40ms, which looked like speed.
Same class as the `mktemp` template this morning: a delimiter I did not notice
was one.
