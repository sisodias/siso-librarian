# Worklog: checking where the truth lives, not just what it says

Date: 2026-08-04 04:45 UTC (from `date -u`)
Thread: verification of asserted values

## The blind spot I named last loop

Re-derivation catches drift in values. It cannot catch a *shared misunderstanding of where the truth lives* — the builder and the declaration carrying the same wrong path, agreeing perfectly on a wrong answer. That is how a hyphen hid six source inventories.

So this loop checked the sources themselves rather than the numbers.

## What the audit found

**Paths: all 28 declared sources exist.** No further typos.

**Registry coverage: now complete.** Enumerating every subdirectory rather than counting named ones confirms all seven are counted, and there are no stray `*.json` at the registry root. The hyphen bug was the only one of its kind.

**Schema assumptions: sound, but incomplete.** Every table and column the queries name exists, and `Minimax` is spelled as the filter expects. But listing all tables surfaced two the observatory never counted — and one of them matters.

`identity_claim` holds **6** rows. `v_person_layers` shows **5** people spanning more than one domain.

That is the cross-domain stitch — the single most-cited structural fact about this graph, the thing `DECISIONS.md` spends a section explaining is structural rather than fixable, and it was visible nowhere on the page. I have now measured it independently: 113 people with zero domains, 280,604 with one, **5 with two**. The charter's figure is correct.

Both are now counted and on the page.

| people_graph bucket | Before | After |
| --- | ---: | ---: |
| people | 280,722 | 280,722 |
| content_edges | 564,579 | 564,579 |
| topic_edges | 2,555,047 | 2,555,047 |
| external_ids | 845,004 | 845,004 |
| identity_claims | not counted | 6 |
| cross_domain_people | not counted | 5 |

## The new gate

Source existence is now checked separately from value, on every verify. The reasoning matters: `file-count` over a missing directory returns **0**, and 0 is a plausible answer. Value-checking alone can never distinguish "genuinely empty" from "looking in the wrong place" — which is precisely why the hyphen survived until I read a directory listing.

Verified it bites by reverting the source path to the underscore form: caught immediately as `derivation-source-missing`. Restored, verify exits 0.

| Measurement | Before | After |
| --- | ---: | ---: |
| snapshot counts re-derived | 16 | 18 |
| derivation sources existence-checked | 0 | 28 |
| registry buckets counted | 7 | 7 (confirmed complete) |
| gates in `npm run verify` | 3 | 3 |

## Residual

Existence is a weaker check than correctness. A path that exists but points at the *wrong* directory — a stale copy, a sibling with a similar name — still passes. Nothing here would catch counting `people_v2.sqlite` when the intended source was a different graph.

The honest statement of coverage: paths are now checked to exist, values to match, and schemas to contain what the queries name. Whether those are the *right* sources remains a human judgement, and I would rather say that plainly than let 28 checked sources imply the question is settled.
