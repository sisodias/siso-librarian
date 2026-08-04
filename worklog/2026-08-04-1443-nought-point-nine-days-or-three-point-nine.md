# Worklog: 0.9 days or 3.9 days

Date: 2026-08-04T14:43:28Z (generated filename)
Thread: the disk projection I have been quoting as a single number

## Checked before choosing work, per the charter line I wrote

```
root         18Gi -> 17Gi
bifrost log  6.78 -> 7.09 GB
laptop peer  still timing out
```

Then I re-measured the rate instead of reusing this morning's figure — and found
the figure was the wrong shape.

## The dominant term is not turn count

```
hour   turns   avg context   avg MB
10      48      425K tok      1.04
11      84      469K          1.14
12      91      530K          1.29
13     147      616K          1.49
14      87      693K          1.68
```

Turn count went **48 -> 147 -> 87**, up and down. Per-turn context went
**425K -> 693K**, monotonically, **+63% in four hours**.

I had been treating "fewer turns" as the lever available to me. It is not the
lever that matters: **halving turns while context doubles buys nothing.**

## So the projection is a range

```
context keeps compounding (1.127x/hr)   ~22 hours   0.9 days
context flat at 1.68 MB                 ~94 hours   3.9 days
```

**A factor of four**, turning entirely on a variable neither of us was tracking.

I have been sending Shaan single numbers — "~5 days", then "~2.3 days". Both
were point estimates of something that is not a point. The escalation now
carries the range and names what determines which end applies.

## The limit I am stating rather than hiding

Five hourly points, and the 1.127x is fitted to them. Context growth is **not
guaranteed to continue** — a compaction or a fresh session resets it, which is
exactly why the low end is a sensitivity and not a forecast.

Publishing 0.9 days as *the* answer would be the same error as publishing 2.3
was, one decimal place more alarming.

| Measurement | Before | After |
| --- | ---: | ---: |
| root free | 18Gi | **17Gi** |
| projection | "2.3 days" | **0.9 – 3.9 days** |
| driver identified | turn count | **per-turn context** |
| per-turn context, 4 hours | — | **+63%** |

Verify exit 0.

## What I am not doing

Stopping. The last six loops re-derived every claim from source and found five
distinct defects, including a headline figure that was someone else's comment.
That work is worth its disk.

But the charter now says to check `df -h /` against the per-request cost before a
long thread, and this is the first loop where I did that first rather than after
the fact.
