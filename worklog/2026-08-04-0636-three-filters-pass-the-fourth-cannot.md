# Worklog: three filters pass, the fourth cannot be mechanised

Date: 2026-08-04T06:36:29Z (generated filename)
Thread: charter gap 2 — sources beyond Gutenberg

## The language filter, measured

| Pool | Any language | `language:eng` | Non-English |
| --- | ---: | ---: | ---: |
| essays / letters / speeches | 1,598 | **782** | **51.1%** |
| periodicals 1880–1930 | 3,515 | **2,164** | 38.4% |

Half the essays pool was non-English. Rebuilt the want-list with the filter — 39 items, one Gutenberg mirror caught and excluded.

## It worked, on the axis it was for

```
before filter:  checked 24   no_creator_metadata 12
after  filter:  checked 39   no_creator_metadata  0   review_possible_duplicate 0
```

The institutional dump of Polish speeches is gone. Every candidate now has a named creator, and none collides with the 35,312 authors the Library already holds.

## And acceptance collapsed from 7 to 1

That looks like regression. It is not, and the diagnosis matters more than the number.

The filter replaced Polish speeches with **English archival correspondence** — sidecars of 239 to 1,606 bytes. Single-page letters. The contract's size/HEAD gate routes those to review, correctly. Acceptance fell because the candidates got *smaller*, not because the gate got stricter. IA also returned HTTP 500 on most HEADs in this sample, which the contract already treats as review rather than rejection.

## The real problem, which no filter fixes

`subject:"letters"` matches **"Letter to Alice from Uncle Fred, 1918"**. That is personal correspondence in an archive, not the published letters the charter means by "god source."

Rights pass. Language passes. Format passes. **Relevance fails**, and there is no fourth filter to add, because relevance is a judgement about what the Library is *for*.

I tried scoping to published collections. `collection:americana` surfaces exactly the right kind of thing — *Antislavery and disunion, 1858-1861*, *Miscellanies* — but only **2 items** carry the speeches subject tag. IA's subject tags are folksonomy, precisely as `SOURCES.md` warned, and subject-based querying cannot reach this material at useful scale.

## Where that leaves gap 2

Three of four gates are mechanised and passing. The fourth needs either a curated identifier list from someone who knows what belongs, or full-text sampling to judge relevance after fetch — which inverts the contract's "check before download" design.

I am not going to pretend a want-list of 1918 family letters is progress on "century-old journalism." The honest position: the adapter machinery works, and I do not yet have a query that finds the right corpus.

| Measurement | v1 | v2 |
| --- | ---: | ---: |
| want-list items | 24 | 39 |
| no creator metadata | 12 | **0** |
| possible duplicates | 0 | 0 |
| accepted by contract gates | 7 | 1 |
| relevant to charter tier-1 | no | **no** |

## The drift gate, legitimately

Verify flagged all ten claims as stale citing "new evidence source" from the want-list commit. That is **correct** — adding a source is exactly the condition that trigger exists for, unlike the verifier-change false positive I narrowed two loops ago. All 20 in-repo grounding ranges re-derived and resolve; all entries re-checked.

Worth noting the contrast: last time this fired I narrowed the trigger; this time I re-checked the claims. The difference is whether the commit actually changed what a claim depends on.
