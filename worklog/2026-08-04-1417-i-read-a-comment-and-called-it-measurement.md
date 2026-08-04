# Worklog: I read a comment and called it measurement

Date: 2026-08-04T14:17:35Z (generated filename)
Thread: the second self-referential claim

## The headline that had no evidence

GQ-004 was my **highest-confidence** live claim at 0.83:

> *"safe to reuse for bounded stateless bulk work — MIT, same author, **~71 input
> tokens per call against ~41,000** through the full harness"*

A 577x ratio, and the entire basis for "safe to reuse". Its two grounded quotes
are about **licence and package resolution**. Neither mentions tokens.

## Following it down

```
1. claim grounds in 2 quotes from my metrics file — both licence/resolution
2. metrics file records measured_input_tokens_per_call: 71, no source
   its 4 declared derivations cover licence and resolution ONLY
3. gateway log has no ~71-token lane. Smallest average anywhere: 11 tokens, 2 requests
4. the numbers are COMMENTS IN ~/bin/mini-pi, dated 2026-07-10
```

```
# every bulk worker call ships ~40K input tokens (measured median) ...
# measured ~71 fresh input tokens for the same bash-tool bulk task (~300-500x cut)
```

**Someone else's measurement, in a comment, restated by me as mine.**

The figures may well be right — mini-pi's author says they are measured. But a
reader of my claim would reasonably believe I measured 71 tokens. I read a
comment.

## The drift on top

The source says **~300-500x**. My claim says 71 vs 41,000, which is **577x**.
Even the restatement moved, and in the flattering direction.

## What I did

Attributed rather than deleted. The metrics file now carries the provenance,
the quote it came from, its date, and the note that nothing here reproduces it.
The claim's position says *"(figures from mini-pi's own comments, not measured
here)"*.

Confidence 0.83 -> **0.62**.

Deleting the number would have been tidier and worse: an unverified figure with
known provenance is more useful than a silent removal, and someone may want to
verify it later.

## What is solid

The parts that are genuinely mine re-derive cleanly — `@earendil-works/pi-coding-agent`
installed, the documented `@mariozechner` path absent, MIT, no LICENSE file
shipped, version 0.80.10 on disk matching the claim.

| Measurement | Before | After |
| --- | ---: | ---: |
| GQ-004 confidence | 0.83 | **0.62** |
| headline figure attributed | no | **yes** |
| claims re-derived from source | 1 | **2** |
| self-referential claims remaining | 5 | **4** |

Verify exit 0.

## The pattern across two claims

GQ-010 was **under**-evidenced and survived — the truth was stronger than the
claim. GQ-004 was **over**-stated and did not. Both had grounding that pointed at
my own summaries, and in neither case did the grounding touch the load-bearing
assertion. That is what "cites only itself" costs: not that the claims are
wrong, but that nothing in the packet tests the part that matters.
