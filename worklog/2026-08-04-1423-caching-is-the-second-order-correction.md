# Worklog: caching is the second-order correction

Date: 2026-08-04T14:23:05Z (generated filename)
Thread: third self-referential claim re-derived

## The claim held, then broke in an interesting place

GQ-002: *"The largest available multiplier on compute effectiveness is prompt
caching, not model selection... a 6.8x spread that tracks cache hit rate rather
than capability."*

Re-derived against the live gateway log:

```
CodexOpenAI    408 req   85.86 out/1k billed   97.2% cached
anthropic    1,553 req   16.38                 93.0% cached
Minimax        181 req   25.31                  0.0% cached
```

**CodexOpenAI matches exactly.** anthropic has risen 12.72 -> 16.38 as volume
grew from 330 to 1,553 requests, narrowing the spread to **5.2x**.

Direction and magnitude both survive. Then:

## MiniMax at 0% cache beats anthropic at 93%

```
Minimax     0% cached  ->  25.31
anthropic  93% cached  ->  16.38
```

A pure cache-rate mechanism **cannot produce that**. If effectiveness tracked
cache hit rate, a 0%-cached lane could not outperform a 93%-cached one.

So I looked at what else differs:

```
avg input tokens per request
  Minimax        22,367
  CodexOpenAI   110,994
  anthropic     524,572
```

**MiniMax ships 23x less context.** Effectiveness per billed token tracks
**context size** first. Caching is what mitigates a large context — the
second-order correction, not a substitute for having a small one.

CodexOpenAI wins because it has both a moderate context *and* the highest cache
rate.

## Rewritten rather than rated down

The claim was not wrong about caching mattering. It was wrong about caching
being **the largest** multiplier and about the mechanism being cache rate. The
position now says so, with the numbers, and carries external grounding.

Confidence 0.71 -> **0.79** — up, because a corrected claim with source-derived
grounding is stronger than an over-stated one citing itself.

| Measurement | Before | After |
| --- | ---: | ---: |
| self-referential claims | 4 | **3** |
| grounding ranges | 22 | **24** |
| declared derivations | 29 | **30** |
| GQ-002 confidence | 0.71 | 0.79 |

Verify exit 0; 24/24 grounding resolves.

## Three claims, three different outcomes

```
GQ-010   under-evidenced   survived, strengthened   0.68 -> 0.84
GQ-004   over-stated       provenance defect        0.83 -> 0.62
GQ-002   partly wrong      mechanism corrected      0.71 -> 0.79
```

None of the three had grounding that touched its own load-bearing assertion.
That is the specific cost of self-reference: not that claims are false, but that
the packet tests the summary instead of the position.
