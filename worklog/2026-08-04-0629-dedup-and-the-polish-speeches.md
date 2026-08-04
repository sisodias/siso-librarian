# Worklog: dedup, and the Polish speeches I nearly ingested

Date: 2026-08-04T06:29:12Z (generated filename)
Thread: charter gap 2 — sources beyond Gutenberg

## Closing the half-solved dedup

Last loop I shipped a want-list that excluded `*gut` identifiers and said plainly that an IA copy under any other identifier would pass. `scripts/ia-dedup-check.mjs` closes that: it reads every distinct book author the Library holds — **35,312** of them — and flags any IA candidate whose creator matches.

The Library's book edges carry **no titles**, only author names and Gutenberg ids, so title matching is unavailable. Author matching is the strongest signal on disk, and it **flags for review rather than rejecting**: two writers share surnames, and an author being in Gutenberg does not make IA's copy of a *different* work a duplicate.

## Getting the name matching right

Naive comparison fails on the shapes that actually occur. Tested against known pairs before trusting it:

| Case | Expected | Result |
| --- | --- | --- |
| `Twain, Mark` vs `Mark Twain` | match | PASS |
| `Clark, William, 1770-1838` vs `William Clark` | match | PASS |
| `Oliphant, Mrs. (Margaret)` vs `Margaret Oliphant` | match | PASS |
| `Dickens, Charles` vs `Charles Darwin` | differ | PASS |
| `Bell, George` vs `George Eliot` | differ | PASS |

The Oliphant case took two attempts. My first fix stripped honorifics but ran *after* parenthetical removal, which had already discarded `(Margaret)` — collapsing the name to `oliphant` and losing the given name entirely. The fix was to keep parenthetical **content** and drop only the brackets.

Worth noting the two negative cases are as important as the positives: a matcher that says yes to everything would flag all 24 candidates and be useless.

## The result, and the surprise

```
checked: 24   distinct_author: 12   review_possible_duplicate: 0   no_creator_metadata: 12
```

**Zero possible duplicates.** The tier-1 targeting worked — essays, letters, speeches and periodicals genuinely are material Gutenberg lacks.

But half the want-list has **no creator metadata at all**, and looking at what they are is the real finding:

```
rcin.org.pl.WA248_15085_...piramowicz-mowa-82-o | Mowa w Dzien Rocznicy Otwarcia Towarzystwa...
rcin.org.pl.WA248_15900_...niemcewicz-glos-16wr | Głos Jasnie Wielmoznego Juliana Ursyna Niemcew...
```

Twelve 18th-century **Polish** speeches from one institutional collection. My query asked for `subject:"speeches"` and IA obliged — with material that is public domain, sidecar-bearing, and passes every gate in the contract.

`SOURCES.md` warned about exactly this: IA OCR quality "degrades on non-Latin and DLI-India material," and subject tags are folksonomy rather than taxonomy. A want-list that passes the rights and format gates can still be the wrong corpus, and nothing in the contract catches "correct but not what the Library wants."

## What this changes

The gates check legality and format. **Relevance is not a gate**, and cannot be — it is a judgement about what the Library is for. The dedup check surfaces it as a side effect: `no_creator_metadata: 12` was the signal that half my want-list was an institutional dump in a language nobody asked for.

| Measurement | Before | After |
| --- | ---: | ---: |
| dedup beyond identifier patterns | none | 35,312 authors indexed |
| want-list candidates checked | 0 | 24 |
| possible duplicates found | unknown | **0** |
| candidates with no creator metadata | unknown | **12** |

## Residual

The want-list needs a language filter and a rebuild before it is a corpus plan rather than a probe. I have not done that in this loop — it means re-running the searches with `language:eng` and re-probing, which is a full loop of its own.

Author matching still cannot catch a genuine duplicate published under a variant name, or an anonymous work the Library holds. It narrows the gap; it does not close it.
