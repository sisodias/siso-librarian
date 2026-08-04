# Worklog: a four-request outlier nearly became the headline

Date: 2026-08-04 08:15 UTC (from `date -u`)
Thread: GQ-002 — 10× the Agent Layer

## The question, and why I had an answer to it

GQ-002 asks what would make the agent layer ten times more effective *per unit of time, attention, and compute*. Registry state: `answered`, no falsifiers.

The compute dimension is directly measurable from the gateway log, and I had been circling it all night without asking it as this question. The metric: **output tokens returned per 1,000 billed input tokens** — what compute actually buys.

| Provider | Requests | % input cached | Output per 1k billed |
| --- | ---: | ---: | ---: |
| CodexOpenAI | 408 | 97.2% | **85.86** |
| Minimax | 166 | 0.0% | 25.09 |
| anthropic | 330 | 91.5% | 12.72 |

A 6.8× spread, and it tracks **cache hit rate, not model capability**. MiniMax, the designated cheap lane, returns the middle figure precisely because it caches nothing. Turning caching on where it is off is a larger multiplier than any model swap available on this gateway.

## The mistake I caught

My first pass reported the best performer as **CodexProxy at 95.55** — a 7.5× spread. That number is real and it is meaningless: CodexProxy has **4 requests**.

I noticed because a byte-offset lookup for `"ratio": 6.8` returned `-1`. The value had silently become 7.5, and chasing why exposed the outlier. A checking mechanism built for a different purpose caught a reasoning error, which is the best argument I have for why the offsets are worth maintaining.

Applied a 100-request floor, recorded the exclusion in the evidence file rather than deleting it. Best is now CodexOpenAI at 85.86 across 408 requests.

Reporting a 4-request outlier as the headline finding would have been exactly the plausible-looking number this repo exists to catch — and I generated it myself, in the loop after writing a handover warning about precisely this.

## Confidence, and the caveat that limits it

0.71, lower than my other measured claims, because **output tokens are a proxy for useful work, not a measure of it**. A model emitting more tokens per unit of input is not thereby more effective — it may be more verbose. This bounds the *cost* side of the 10× question and says nothing about quality.

The claim's scope says so explicitly rather than letting a clean 6.8× imply more than it supports.

| Measurement | Before | After |
| --- | ---: | ---: |
| God Questions with local claims | 3 of 7 | **4 of 7** |
| claim packets | 6 | 7 |
| grounding ranges verified | 11 | 13 |
| claims about questions I did not mint | 3 | 4 |

## The convergence worth noting

Four independent questions have now landed on the same finding from different directions. GQ-008 asked which model owns which work shape and found the cost comparison mispriced by caching. GQ-006 asked about the information organ and found push unevidenced. GQ-002 asks about 10× effectiveness and finds caching is the multiplier.

The routing fix sitting unapplied in `scripts/minimax-cache-route.sh` is now the recommended action of two separate registered questions. That is not additional evidence — it is the same evidence viewed twice — but it does mean the decision blocks more than one line of work.
