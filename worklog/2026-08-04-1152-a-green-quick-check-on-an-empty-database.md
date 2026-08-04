# Worklog: a green quick_check on an empty database

Date: 2026-08-04T11:52:07Z (generated filename)
Thread: opening the twelve instead of ranking them

## Why open all of them

Last loop I called `books.sqlite` low-value because no claim cited it, then
found the bibliographic catalogue inside. The ranking was backwards — **nothing
cited it because I had not looked**. Same reasoning would have mis-ranked the
rest, so I opened every remaining database.

Five failed to answer a basic query. That turned out to be two different things.

## Four healthy files that looked broken

```
people_v2.books-only.sqlite            error 14
people_v2_gh.PRE-ENRICH-...sqlite      error 14
foundry_usage_ledger.db                error 14
intents.db                             error 14
```

All four are **fine**: `write_version 2` (WAL), and they open normally with
`immutable=1`, holding 12, 12, 2 and 8 tables. Same trap that made every vault
database unverifiable until this morning.

A survey without that flag would have reported four healthy databases as
unreadable — and I would have believed it, because "unreadable" is the answer I
was half expecting.

## One that is actually corrupt

```
~/foundry-data/usage-cache/staging-raw.db   0.42 GB
valid SQLite header, write_version 2
quick_check -> database disk image is malformed (11)
```

`immutable=1` does not help. This is not the WAL case.

Its sibling is named `staging-recovered.db`, so someone already ran `.recover`.
And that recovery is where the real lesson is:

```
quick_check      ok
migrations       34
logs              0
mcp_tool_logs     0
async_jobs        0
lost_and_found  7,583
```

**`quick_check` says ok on a database whose every real table is empty.** All
7,583 salvaged rows sit in `lost_and_found` with anonymous `c0..c57` columns
across 13 root pages — structurally valid, semantically lost.

That is the sharpest example this session of a green signal meaning nothing.
`quick_check` verifies page structure, not that the data is where it belongs,
and a recovery can satisfy it completely while losing every row's identity.

## What I did not do

No repair. Both files are in `usage-cache/`, their tables are Bifrost gateway
staging, and no claim cites either — a cache is not worth a risky operation
under C1. Escalated rather than acted, and marked *not urgent* so it does not
compete with the disk decision in the same message.

| Measurement | Value |
| --- | ---: |
| databases opened | 12 |
| looked broken, actually healthy | **4** |
| genuinely corrupt | **1** |
| rows salvaged but unattributed | 7,583 |

Verify exit 0.

## The ranking problem is not solved

I now know what is in all fifteen. That is better than guessing, and it does not
tell me which deserve backups — `books.sqlite` was valuable and uncited, the
PRE-MERGE snapshots are large and probably redundant. Knowing contents narrows
the question without answering it.
