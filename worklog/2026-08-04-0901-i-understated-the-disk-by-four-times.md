# Worklog: I understated the disk by four times

Date: 2026-08-04T09:01:36Z (generated filename)
Thread: decision 6 — the escalation I sent and never re-measured

## Why I left the gates alone this loop

Many loops of hardening checkers. Meanwhile the one thing I flagged as
**TIME-SENSITIVE** — root disk filling — I escalated once and never checked
again. So I checked.

## The figure I sent Shaan was wrong

My message said **~1GB/day**. Measured:

```
2026-08-01    136 req   0.00 GB
2026-08-02     28 req   0.01 GB
2026-08-03    759 req   0.72 GB
2026-08-04  1,308 req   3.61 GB   (day incomplete)
```

**3.61 GB today**, understating by roughly 4x. And it is not linear — growth
tracks fleet activity, so it accelerates exactly when the machine is busiest.

Root disk: 27Gi -> 21Gi -> **19Gi** free. At the real rate that is **~5 days**,
not the ~3 weeks the original figure implied.

## Two theories I checked instead of recording

**"5.2 GB of unvacuumed free space."** The `logs` table occupies 5,411 MB while
my column sums found only 179 MB, so I concluded the rest was deleted rows
awaiting VACUUM. Wrong: `freelist_count` is **0**. Nothing is reclaimable.

The real reason my sums came up short is that I guessed column names —
`input_history` and `output_message` are empty; the bulk lives in
`raw_request` (2,247 MB) and `responses_input_history` (2,185 MB). Reading the
schema instead of assuming it gave 4.4 of 5.3 GB accounted for.

**"Age-based retention will fix it."** Only **0.01 GB** is older than 2 days. The
volume is recent traffic — mine — so a retention policy buys almost nothing
today. That is worth knowing before proposing one.

## Corrected the escalation in place

The message is still queued and still undelivered, so it is still editable. It
now carries the measured daily table, the per-column breakdown, both failed
theories, and the ~5 day figure. The wrong number never reaches Shaan.

Second time this session that a queued escalation was wrong and correctable
because it had not been delivered. The channel being down keeps turning out to
be a grace period.

## A derivation I deliberately did not declare

`rows` and `file_bytes` moved **while I was writing the file** — 2,232 to 2,237
rows and +10 MB inside a minute. The audit caught both as mismatches.

They are live counters, not facts. Declaring a derivation over one makes the
gate fail on every run for a reason that is not a defect, which is how gates get
disabled. Recorded as timestamped observations with a note; only `free_pages`
stayed declared.

| Measurement | Reported | Actual |
| --- | ---: | ---: |
| log growth | ~1 GB/day | **3.61 GB/day, accelerating** |
| days of headroom | ~21 | **~5** |
| reclaimable by VACUUM | (assumed most) | **0** |
| reclaimable by 2-day retention | (assumed most) | **0.01 GB** |

Verify exit 0; checks_skipped 0.

## Still not mine to fix

Decision 6 remains Shaan's: pruning a gateway log is his call, and C1 says never
delete. What I can do is make sure the number he decides against is the real
one. It now is.
