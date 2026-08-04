# Worklog: a falsifier that could not fire

Date: 2026-08-04T07:07:38Z (generated filename)
Thread: GQ-005 — closing the gap I opened last loop

## Why this and not something else

Last loop I wrote GQ-005's contract and recorded that its falsifier 1 was
**unusable**: scoring predictions against a naive baseline requires a baseline,
and none existed. I logged that honestly and moved on.

That was the wrong place to stop. A contract that looks complete but cannot fire
is the precise defect I had just spent a loop removing from GQ-002 and GQ-008,
and I had left a fresh instance of it in my own work. Whether it stayed true was
under my control.

## The signal that looked right and was not

The people graph carries `star_velocity`, `star_delta`, and `momentum_day` —
exactly the fields a movement map wants. They are unusable:

```
star_delta   null on 406,297 of 463,230 rows
             zero on  56,904
         positive on      28
distinct momentum_day values: 1   (2026-07-11)
```

**One observation day is a snapshot, not a time series.** No aggregation over
those fields can produce a delta, because the second observation does not exist.
Had I built the baseline on the field whose name matched my intent, I would have
produced a confident ranking of nothing.

## What actually carries time

`created_at` — repository birth dates, dense across every cohort. That changes
the measurable quantity from "what is gaining stars now" to "what share of each
year's **new** repositories chose this technology". The time is carried in the
data rather than in when I happened to look, so one read suffices.

| cohort | repos | unlabelled | TypeScript | Python | Rust |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2021 | 33,278 | 9.85% | 9.62 | 21.13 | 3.94 |
| 2022 | 29,933 | 10.72% | 10.85 | 21.59 | 5.05 |
| 2023 | 31,455 | 10.31% | 11.40 | 28.30 | 4.54 |
| 2024 | 25,516 | 9.94% | 12.36 | 30.89 | 4.60 |
| 2025 | 23,790 | 8.69% | 16.09 | 32.57 | 4.59 |
| 2026 | 13,866 | 10.01% | 19.98 | 29.22 | 6.18 (PARTIAL) |

Baseline rule, deliberately dumb: **next cohort share = last complete cohort
share**. A movement map that cannot beat "assume no change" has not identified
movement. 2026 is excluded — a partial year looks like a trend break if you
forget why it is short.

## A bug I nearly shipped

The first run tracked `""` as a language at an **8.68% share — ranked above
Rust**. My `coalesce` caught SQL NULL as `(none)`; a JSON null renders as an
empty string and slipped past it. Two sentinels, one guard.

I excluded it, and then reported `unlabelled_pct` per cohort rather than
dropping it silently — leaving it out entirely would imply the tracked languages
sum to the whole cohort.

| Measurement | Before | After |
| --- | ---: | ---: |
| GQ-005 falsifier 1 | unusable | **usable** |
| baselines on disk | 0 | 1 |
| phantom language in tracked set | present | removed |

Registry `6ac92dc`; verify exit 0.

## What I did not claim

TypeScript rising 9.62 -> 19.98 across cohorts is a real delta in this corpus.
It is **not** a prediction, and I have not made one. The baseline exists so that
a future prediction can be scored — the map itself is still unbuilt, and GQ-005
stays `scoped`.

The baseline also covers **language only**. The question asks about categories,
techniques, and projects; three of its four subjects still have no baseline, and
I recorded that as evidence gap 2 rather than letting one axis stand in for four.
