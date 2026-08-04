# Worklog: I sized a corpus by sampling three authors

Date: 2026-08-04T06:45:59Z (generated filename)
Thread: charter gap 2 — sources beyond Gutenberg

## Correcting a number I put in front of Shaan

Decision 7 offered, as its cheapest option, "accept a small high-confidence corpus (**dozens, not thousands**)."

That was wrong. I had estimated the pool size from **three author queries** — Twain, Howells, Stevenson — and generalised from a sample of three to a claim about a corpus of millions.

Measured properly:

| Filter | Count |
| --- | ---: |
| English public-domain texts | **270,065** |
| excluding `printdisabled` / `inlibrary` | **270,046** |
| in `americana` (published works) | 119,200 |
| pre-1930 | 114,811 |
| `americana` + pre-1930 | 37,299 |

Not dozens. Two hundred and seventy thousand.

## Why the error happened

Twain has 2,015 IA texts and exactly 1 with `rights:"public domain"` — a ratio of 1 in 2,015. I treated that as representative and reasoned that the whole rights-clean pool must be correspondingly tiny.

It is not, because the rights field is not sparse *uniformly*. It is populated on institutional scans and absent on the famous-author material I happened to probe. Sampling the axis I cared about told me nothing about the pool, and I did not check.

The lesson is narrow and worth stating: **a ratio measured on a biased sample does not scale to the population.** I inverted a real finding — Twain's rights metadata is genuinely absent — into a false claim about corpus size.

## What it does not fix

Volume was never the constraint. The head of the 270k pool is still ephemera:

```
1952  Golden Gater 1952-09-17          (student newspaper)
1925  Sales catalogue: Sotheby's
1891  William Cheyney Letter to son
1900  Patterson family waiting for the train
```

So the correction *sharpens* the problem rather than solving it. There is plenty of rights-clean material; I still cannot express which of it the Library wants. A publication-year rights heuristic — my second option — now looks actively unattractive, because it would add volume to a pool that already has volume.

Decision 7 rewritten to say so, with the live options reduced to two: a curated identifier list, or full-text relevance sampling after fetch (which inverts the contract's check-before-download design and needs Shaan's view).

## Two gates caught me this loop

`script-unreferenced: scripts/ia-dedup-check.mjs` — I added a script last loop and never registered it. This is the **same orphan-script problem I fixed once already**, recurring because registration is a manual step. Now `npm run ia:dedup`, documented.

`new evidence source` drift, legitimately, from the want-list rebuild. All 20 grounding ranges re-derived and resolve; entries re-checked.

| Measurement | Stated | Actual |
| --- | ---: | ---: |
| high-confidence IA corpus | "dozens" | **270,046** |
| unregistered scripts | 0 | 1 → 0 |
| grounding ranges resolving | — | 20/20 |

## Residual

Three messages queued now; link still down. The corrected decision 7 has not reached Shaan, which means the wrong figure is the one currently sitting in his mailbox from the earlier send — the repo has the correction, the mailbox does not, and I cannot fix that until the link returns.
