# Worklog: I generalised from one database to the machine

Date: 2026-08-04T12:06:34Z (generated filename)
Thread: opening the last five

## The correction

Earlier today I rejected star velocity as a GQ-005 signal:

> *"star_delta null on 406,297 of 463,230 rows. distinct momentum_day values: 1.
> One observation day is a snapshot, not a time series."*

Every number there is correct. The conclusion was not, because I wrote it about
**the machine** and had only measured **the graph**.

`momentum.sqlite`, 0.01 GB, one table:

```
2026-07-09   56,687
2026-07-10   56,687
2026-07-11   56,688
```

**Three consecutive days.** Real deltas are computable — 56,687 repos appear on
all three, 29 gained stars, top mover **+1,112**.

```
DeusData/codebase-memory-mcp   +1112
headroomlabs-ai/headroom        +512
omnigent-ai/omnigent            +230
punkpeye/awesome-mcp-servers    +101
```

Backed up (`quick_check ok`, 170,062 rows MATCH) and GQ-005's evidence gap
corrected in the registry.

## The shape of the error

This is the same mistake as quoting 463,230 content edges when the table holds
564,579 — I measured a **subset** and described the **whole**. Twice in one
session I stated a limit of the system after checking one database.

The tell is available both times, in hindsight: I never asked *"is this the only
place that data could live?"* before concluding it did not exist. Rejecting a
signal is a stronger claim than accepting one, and I applied less evidence to it.

## What has not changed

Three days ending **2026-07-11** — nearly a month stale. Enough to prove deltas
are computable; nowhere near enough to score a dated prediction. The cohort
baseline is still the usable movement signal, and GQ-005 stays `scoped`.

## The other four

```
intents.db               intent 10,269, spawn 4,919
foundry_usage_ledger.db  60,369 rows
passage_summary.sqlite   book_passages 77,539
people_video_queue.sqlite   97 rows
```

Opened, contents recorded, none backed up yet. `passage_summary` is 77,539
against the passage index's 77,540 book bodies — one short, which is a thread
worth pulling before assuming it is derived.

| Measurement | Value |
| --- | ---: |
| databases with a real time axis | 1 (found) |
| observation days | 3 |
| repos with computable deltas | 56,687 |
| verified vault backups | 5 -> **6** |
| conclusions corrected | 1 |

Verify exit 0; registry pushed as `fa582cf`.
