# Worklog: configured is not enforced

Date: 2026-08-04T23:15:20Z (generated filename)
Thread: the retention setting I verified and never tested

## What I got wrong

Yesterday I set `log_retention_days` from 365 to 3, re-read it from the
**running process** rather than trusting my own UPDATE, and wrote that it
*"bounds future growth"*.

The first half was careful. The second half was an assumption.

Measured six hours later:

| | |
| --- | --- |
| live setting | **3** |
| oldest row | 2026-08-01, **3.15 days** — past the threshold, still there |
| rows past the window | **136**, none evicted |
| `page_count` | 2,300,871 → **2,463,958** (grew) |
| `freelist_count` | 0 |
| Aug 4 payload | 4.35 → **4.74 GB** |

**The setting is live and nothing acts on it.** A retention that never runs is
worse than none, because it reads as solved — and I had already written it down
as solved.

## The eviction, and an ordering bug I caught first

`npm run log:enforce-retention`, dry-run by default.

My first version verified the **existing** slice and then deleted. That proves
the old slice still answers; it says nothing about the rows about to go. And the
rows about to go mattered: of the 136 past the window, **52 were CodexOpenAI and
44 Minimax** — exactly the providers all five derivations read.

Fixed to refresh the slice, re-verify, and only then delete.

## The result, including the part that did not work

```
rows  : 3,580 -> 3,445   (136 deleted)
bytes : 9.42 GB -> 9.45 GB
quick_check: ok
```

**The file grew despite a VACUUM.** Those 136 rows were the oldest and smallest,
and live traffic during the rebuild outpaced whatever they freed. Row-count
retention does not control this file — **size does**. I am writing that down
rather than reporting a 136-row deletion as a disk win.

## What did work

After deletion, `archive-log-slice.sh --verify` reported **1/5**, which looks
alarming and is correct: it compares slice against *live*, and live no longer
has those rows. The slice does.

```
45285517 / 109467 / 408 / 85.86    — unchanged, from the slice
32 derivations re-derived, 0 unavailable, 0 skipped
```

**Deleting the live rows cost nothing**, because the numbers were already
preserved. The 643 KB slice I built yesterday did exactly the job it was built
for, on the first occasion that job existed.

Decision 6 corrected in place. Verify exit 0. Gate self-test 15 passed, 0 failed.
