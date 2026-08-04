# Worklog: the error that looked like the defect

Date: 2026-08-04T07:27:15Z (generated filename)
Thread: GQ-008 — the metrics file I said could only be re-run, not queried

## What I did

Last loop I left GQ-008's evidence flagged as `metrics-underived` and said it
"needs re-running, not a query". That was a correct diagnosis and an incomplete
action: I described the remedy and did not perform it.

`scripts/gq008-cache-experiment.sh` now performs it. Two calls per path — the
first populates the cache, the second reads it, because a single call reports 0
cached tokens on a **working** path and looks identical to a broken one.

## The finding reproduces

```
go-llm-proxy 8789:  prompt 1078, cached 1024   cache_works: true
Bifrost      8080:  prompt 1078, cached    0   cache_works: false
```

Same body, same credential, same model, **same prompt_tokens on both paths** —
only the route differs. Token counts differ from the original run because the
prompt differs; the finding is identical. Bifrost is not forwarding
`cache_control` to the provider.

## The trap I walked into

The first run of my own script produced this for the Bifrost arm:

```
provider is required in model field (format: provider/model)
```

**That is an error, not a cache miss.** Had the script recorded it as
`cached_tokens: 0`, it would have looked *exactly* like the defect under
test — and I would have "reproduced" the finding without the request ever
reaching MiniMax. A rejected request and a stripped `cache_control` header both
yield "no cached tokens" while meaning entirely different things.

Two corrections followed:

1. The gateways name the model differently, and the provider prefix is
   **case-sensitive**: `Minimax/MiniMax-M3` works, `minimax/MiniMax-M3` is
   rejected. I read it from `/api/providers` rather than guessing a third time.
2. The script now **refuses to record any run where an arm errored**, exiting 75.
   Reproducing a finding and manufacturing one differ by exactly this check.

I also mis-read the log earlier in the loop: 1,978 rows against 408 asserted
requests looked like rotation, so my first conclusion was "no longer
re-derivable". Wrong — the log is append-only and had **grown**. I checked
before recording it, which is the only reason it is not in a metrics file now.

| Measurement | Before | After |
| --- | ---: | ---: |
| underived grounded metrics | 5 | **5** (GQ-008 now reproducible, not derivable) |
| GQ-008 finding | stored once | **re-run and reproduced** |
| experiment scripts | 0 | 1 |
| grounding ranges resolving | 20/20 | 20/20 |

## On the count not moving

`metrics-underived` still reports 5, and GQ-008 is still among them. That is
correct and I am leaving it: a **derivation** re-reads a source that already
holds the answer; this **experiment** produces a fresh observation that could
contradict the stored one. Adding a derivation kind that quietly re-read the
stored result would turn the gate green while checking nothing — the precise
failure mode I have hit three times this session.

So the file stays flagged, and now carries `reproduced_by` pointing at a script
anyone can run. The honest state is "reproducible, not derivable", and the gate
has no vocabulary for that yet.
