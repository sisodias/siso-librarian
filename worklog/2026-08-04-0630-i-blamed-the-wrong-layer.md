# Worklog: I blamed the wrong layer

Date: 2026-08-04 06:30 UTC (from `date -u`)
Thread: GQ-008 — Model Routing Evidence

## What I claimed an hour ago

That MiniMax caches 0% of its input while other providers on this gateway cache 91–97%, and the cheap lane therefore pays full freight because nothing in its path sends `cache_control`.

The measurement was right. **The attribution was wrong**, and testing the fix is what exposed it.

## The sequence

I went to test whether `cache_control` survives the 8081 shim end-to-end. It did not — identical 3,033 input tokens on repeated calls, no cache fields returned at all.

Reading my own translator found the apparent culprit: `anthropicToOpenAIChat`, written by me earlier tonight, flattens content blocks to plain strings and drops `cache_control` entirely. I fixed it to preserve the annotation, added `cache_read_input_tokens` to the response translation, restarted the catalog on the exact PID, and re-ran.

**Still zero.** The fix was correct and insufficient, which is the useful kind of failure.

So I sent the exact shape my shim now emits to each upstream in turn, same body, same credential, only the path differing:

| Path | Prompt tokens | Cached |
| --- | ---: | ---: |
| go-llm-proxy `127.0.0.1:8789` | 3,033 | **2,944** |
| Bifrost `127.0.0.1:8080` | 3,033 | **0** |

The provider caches correctly. **Bifrost strips or fails to forward `cache_control`.** My shim routes MiniMax traffic through Bifrost, so the saving is lost downstream of everything I fixed.

## What this corrects

My v1 claim said the cheap lane pays full price because the path does not send `cache_control`. That framing implied a missing feature, and pointed the action at "enable caching or stop using MiniMax for large-context work" — a routing-matrix decision.

The truth is narrower and more actionable: **the capability exists and one gateway component discards it**. The cost disadvantage is a defect to repair, not a property to route around. v2 supersedes v1 at confidence 0.86 — higher than v1's 0.74 because a two-path isolation with identical inputs is much stronger evidence than an aggregate over mixed historical traffic.

Measured saving: 2,944 of 3,033 tokens per repeated call, about 97%.

## The methodological point

The aggregate that produced v1 — "Minimax: 0% cached" across 143 logged requests — was true and pointed at the wrong cause. Every one of those requests went through Bifrost, so the log could only ever show Bifrost's behaviour. I read a property of the *measurement path* as a property of the *provider*.

Nothing in my verification machinery could have caught that. The numbers were correctly derived, the byte ranges resolved, the sources existed. What caught it was trying to fix the problem and having the fix fail.

That is worth stating plainly: attempting the repair was a better verification of the diagnosis than any amount of re-deriving the evidence.

## State

| Measurement | Before | After |
| --- | ---: | ---: |
| claim packets | 4 | 5 |
| grounding ranges verified | 7 | 9 |
| GQ-008 claims | 1 | 2 (v1 superseded) |
| cache_control preserved by shim | no | yes |
| cached tokens surfaced in shim response | no | yes |

## Residual

The shim changes are real improvements that currently buy nothing, because the traffic still transits Bifrost. They become load-bearing the moment the routing is changed, and I have left them in place rather than reverting — with a comment explaining they are inert until then.

Repointing the shim at the proxy would deliver the saving today. I have not done it: that changes gateway topology for every agent on this machine, and a 97% cost improvement is exactly the kind of tempting change that should not be made unilaterally at 06:30 by the agent that found it.
