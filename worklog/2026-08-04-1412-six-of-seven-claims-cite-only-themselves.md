# Worklog: six of seven claims cite only themselves

Date: 2026-08-04T14:12:29Z (generated filename)
Thread: claims review, which I had called blocked on a person

## The structural finding

```
GQ-001  grounding 3   external 0
GQ-002  grounding 2   external 0
GQ-004  grounding 2   external 0
GQ-006  grounding 2   external 0
GQ-008  grounding 2   external 0
GQ-009  grounding 3   external 2   <- the only one
GQ-010  grounding 2   external 0
```

**Six of seven live claims ground only in metrics files I wrote.** Re-deriving
those metrics confirms the metric, not the position — the evidence chain closes
on itself.

That is not the same as the missing reviewer, and unlike the reviewer it is
something I can act on.

## Testing GQ-010 against the source

The claim says stars and dependence *"diverge by orders of magnitude"*. Its
grounding is two numbers showing **neither divergence nor a comparison** — one
repo's dependent count and a coverage total.

So I went to the graph. 498 repos carry both signals:

```
top by stars                          top by dependents
vuejs/vue        209,864 / 0 dep      emoji-regex      1,909 / 4,193,583
affaan-m/ECC     209,165 / 0 dep      globby           2,643 / 3,765,491
javascript-algos 196,067 / 7 dep      p-map            1,499 / 3,047,734
microsoft/vscode 186,011 / 166 dep    webpack-dev-srv  7,851 / 2,955,806
```

```
overlap of the two top-50 lists            8 of 50
top-50 starred repos with ZERO dependents  20 of 50
```

**Confirmed, and the claim was under-evidenced.** "Nearly disjoint rankings" is
a stronger and more precise statement than "diverge by orders of magnitude", and
it now has grounding that does not point back at my own summary.

Confidence 0.68 -> **0.84**. Grounding 2 -> 4, of which 2 are external.

## A schema error worth keeping

My first attempt failed validation — I invented the grounding shape instead of
copying an existing entry, and missed `locator` and a valid `source.kind`. The
gate caught it before it reached a push.

Notably the **byte ranges resolved on the first try** (22/22). The quotes were
right; the envelope was wrong. A checker that only tested dereferencing would
have passed a malformed packet.

| Measurement | Before | After |
| --- | ---: | ---: |
| live claims with external grounding | **1 of 7** | 2 of 7 |
| GQ-010 confidence | 0.68 | **0.84** |
| grounding ranges resolving | 20/20 | **22/22** |
| declared derivations | 28 | **29** |

Verify exit 0.

## What this does not do

It does not review the claim. I re-derived my own assertion from the source,
which removes the self-reference and leaves the single reviewer — a second party
could still find the query wrong. Five claims still cite only themselves, and
that is now a measured backlog rather than a property I had not noticed.
