# Worklog: claiming GQ-008, and contradicting its "answered" state

Date: 2026-08-04 06:25 UTC (from `date -u`)
Thread: GQ-008 — Model Routing Evidence

## Why this question

Every claim in this repo so far has been about GQ-009 — the question about the question layer — or GQ-010, which I minted myself. That is a closed loop dressed as a portfolio. GQ-008 is registered, active, owned by someone else, and directly overlaps evidence I measured tonight without meaning to.

Its contract asks: *"Which available model should own each recurring work shape after quality, reliability, tool use, latency, quota, and cost are evaluated together?"* State: **answered**. Falsifiers: **none**.

## What the gateway log says

A read-only aggregate over every logged request, no sampling:

| Provider | Requests | Raw input | Cached reads | % cached | Billed input/req |
| --- | ---: | ---: | ---: | ---: | ---: |
| anthropic | 238 | 132,536,958 | 121,201,669 | 91.4% | 47,430 |
| CodexOpenAI | 408 | 45,285,517 | 44,010,496 | 97.2% | 3,125 |
| Minimax | 143 | 3,703,946 | 0 | **0.0%** | 25,902 |
| CodexProxy | 4 | 1,235 | 0 | 0.0% | 309 |

Caching is not uniform, and the routing consequence is large.

On raw tokens MiniMax looks 21× lighter than Anthropic per request. After caching, the billed gap collapses to **1.8×**. And CodexOpenAI — the lane nobody calls cheap — bills **3,125** input tokens per request against MiniMax's **25,902**, roughly **8× fewer**.

The designated cheap lane pays full freight on every token because nothing in its path sends `cache_control`. I proved separately tonight that MiniMax *can* cache: a repeated call through the proxy read 2,816 of 2,887 prompt tokens from cache. The capability exists and the routing path does not use it.

## The claim

`claims/GQ-008-routing-cache-economics.claim.json`, status **proposed**, confidence **0.74**. Both citations carry byte ranges verified to dereference to their quoted text.

Confidence is not higher for a reason worth stating: billed *input* tokens are one dimension of a six-dimension question. Quality, reliability, tool use, and latency are untouched here, and a model that bills fewer tokens while failing the task is not cheaper. I am claiming the cost dimension is mispriced, not that the routing matrix is wrong.

The proposed action deliberately stops short: either enable caching on the MiniMax path or stop treating it as the default cheap lane for large-context work. Those have very different costs and the choice is not mine.

## On contradicting an "answered" question

GQ-008 is marked answered with no falsifiers, which means there is no recorded condition under which it would be reopened. I am not editing that Work — it is not my repository and the state is someone's judgement.

But this is exactly the case the falsifier field exists for, and its absence is why the contradiction has to arrive as a proposal from outside rather than as a trigger firing inside. `Testable contracts: 1 of 7` is not an abstract gap; here is one concrete cost of it.

| Measurement | Before | After |
| --- | ---: | ---: |
| God Questions with local claims | 1 of 7 | 2 of 7 |
| claim packets | 3 | 4 |
| grounding ranges verified | 5 | 7 |
| claims about questions I did not mint | 1 | 2 |

## Residual

I have still never fired watch trigger 5 — no proposal of mine has survived independent review, and this one is a candidate precisely because it disagrees with a settled answer. It needs a reader who is not me.

The measurement is also gateway-local. It describes traffic through this Bifrost instance on this machine over its logged lifetime; it is not a claim about these providers in general, and a different workload mix would move every number in the table.
