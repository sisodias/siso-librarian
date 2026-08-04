# Worklog: the smallest file held the only copy

Date: 2026-08-04T12:02:07Z (generated filename)
Thread: the three databases I said needed real thought

## What I found

`people.sqlite` — **0.03 GB**, the file I ranked last twice. Once for having no
citations, once for being small.

```
author_value    124,185 rows
person              471
person_content      432
```

`author_value` holds scored authors: volume, peak, breadth, adoption, density,
freshness, licence, repo count, top repo, total stars, dependents. **The v2 graph
has no such table.**

It carries `author_value` inside `person_content.meta_json` — for **8 owners**.
Against 124,185.

The scoring was effectively never migrated. A 0.03 GB file I dismissed twice was
the **only copy** of 124,185 author valuations.

Backed up and verified: `quick_check ok`, all three tables MATCH.

## Both my ranking proxies have now failed

```
books.sqlite    uncited      -> the bibliographic catalogue
people.sqlite   0.03 GB      -> the only copy of 124,185 author scores
```

I ranked by citation count and it was backwards — nothing cited `books.sqlite`
because I had not looked inside. I then ranked by size and it was backwards
again — the smallest remaining file held the least replaceable data.

**Size and citation count are not evidence about content.** Two loops, two
proxies, two failures in the same direction: both made me deprioritise the thing
that mattered.

## Also settled

`people_v2.books-only.sqlite` (0.08 GB) is provably contained in the live graph
— 0 persons and 0 edges absent. A filtered view, not unique data. Fourth
snapshot proven redundant.

| Measurement | Before | After |
| --- | ---: | ---: |
| verified vault backups | 4 | **5** |
| author scores with a backup | 0 | **124,185** |
| snapshots proven redundant | 3 | **4** |
| ranking proxies that failed | 1 | **2** |

Verify exit 0.

## What is actually left

`momentum.sqlite` (170,062 repo snapshots), `intents.db`, `foundry_usage_ledger.db`,
`passage_summary.sqlite`, `people_video_queue.sqlite`, plus the corrupt cache and
its partial recovery.

I am not going to predict which of those matters. The evidence from this loop is
that my predictions about unopened databases are wrong in a consistent
direction, so the only reliable method is the slow one: open it, see what is
inside, test whether it exists elsewhere.
