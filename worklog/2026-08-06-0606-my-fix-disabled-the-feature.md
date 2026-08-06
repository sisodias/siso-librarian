# Worklog: my own fix disabled the feature it was protecting

An hour ago I fixed a seven-minute search query with a **term-frequency budget**:
skip the modern-spelling index when a term is too common to exclude cheaply. I
wrote in the worklog that this was "a real loss of long-s recall" and called it a
stated tradeoff.

Then I measured the loss instead of leaving it as an assertion.

## Seventeen of twenty

Of twenty classic long-s words, **17 exceeded the budget**:

```
such 198,400   those 185,910   first 198,012   present 111,794
surface 80,304  disease 54,641  cause 46,157   possible 44,198
himself 35,469  distance 29,638 house 24,718   vessel 24,159
sense 20,572    season 19,214   passage 17,836 phosphorus 13,266
instrument 11,862
```

The modern index was disabled for **85% of the queries it exists to serve**. The
tool's own header says it resolves `"fuch" -> "such"` — and `such` was the single
most-skipped word in the corpus. That is not a tradeoff, it is switching the
feature off and writing a note about it.

## The real fix

The key fact, which I had not looked for: **`passage_modern` and
`passage_ext_search` assign the same rowid to the same passage.** Verified at
rowid 500 — `antislaverydisun00unse:40` in both.

So the exclusion needs no cross-index set operation at all. For each modern hit,
look up that rowid in the printed index's **content table** — an ordinary B-tree
— and ask whether the printed text contains the terms.

**Per term, not as a phrase.** FTS matching "electromagnetic induction" means
both words appear anywhere; a literal `LIKE '%electromagnetic induction%'` finds
only adjacency. Measured: FTS **10** rows, phrase-LIKE **2**, per-term-LIKE
**10**. The phrase form would have admitted 8 duplicates.

**Cap candidates, not results.** `LIMIT` bounds rows *returned*, which bounds
nothing for a stopword: "the" matches 2,723,718 modern rows and nearly all also
print "the", so the join walked millions to find three — 58 seconds. Capping
**candidates** at 40,000 is safe in a way the frequency budget was not: every
candidate is still tested by the same exclusion, so whatever it finds is exactly
correct. It stops looking; it does not lower the bar.

## Result

| query | before | after |
| --- | ---: | ---: |
| the | 434,042ms | **2,377ms** |
| such | *skipped entirely* | **483ms**, 3 modern-only hits |
| those | *skipped* | 527ms |
| cause | *skipped* | 577ms |
| surface | *skipped* | 345ms |
| himfelf | 15,057ms | 217ms |

**0 duplicates** across nine queries. Long-s words served: **20 of 20**, was 3.

Spot-checked three "such" results against the printed text: all genuinely
modern-only — "witneffed", "creaturcs", the OCR the index was built for.

## The same mistake twice in one file

I put a **backtick inside a template-literal comment** and broke the whole
script — for the *second* time today, in the same file. Both times every query
returned 0 hits in ~40ms, which reads as speed until you look at one.
