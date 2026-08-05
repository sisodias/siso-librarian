# Worklog: measuring the blast radius

Date: 2026-08-05T02:11:49Z (generated filename)
Thread: the pattern I named twice and never acted on

## The gap

Twice yesterday a guard I added broke a suite it was **not aimed at**. I wrote
*"every new check has a blast radius"* — and did nothing.

Five suites existed and **nothing ran them together**. Each time I added a gate
I ran whichever suite came to mind, which is precisely how both failures reached
the next turn before anyone noticed.

`npm run check:all`. Every suite, run to completion, **no short-circuit** — a
chain that stops at the first failure hides how many things one change broke,
and that count is the whole point.

## Proven on the real failure

I reverted yesterday's scratch-copy hook wiring on a copy:

```
2 pass, 2 FAIL: verify chain, gates load-bearing
```

**Two suites, not one.** The blast radius was wider than what I noticed at the
time — I had seen the load-bearing baseline fail and missed that verify was
failing too.

## Timings forced a split

| suite | time |
| --- | ---: |
| verify | 97s |
| **gate self-test** | **437s** (replays the whole chain, once per case × 15) |
| retention | <1s |
| load-bearing | ~300s (replays the chain once per gate) |
| **full run as a pre-push hook** | **8m 24s** |

A gate that makes pushing painful is a gate that gets bypassed. `--quick`
keeps **verify + retention (128s)** on every push; the two chain-replaying
suites run from `check:all` by hand.

## The hook now covers more than it did

| | |
| --- | --- |
| was | `npm run verify` only |
| now | `check-all --quick` — verify **and** the retention self-test |

The retention self-test guards the only script here that deletes data, and the
hook never ran it. What `--quick` skips is written **in the hook itself**, so
nobody reads it as covering everything.

Full suite: **4 pass, 0 fail** — verify, 15 gate cases, 6 retention cases,
7 of 7 load-bearing.
