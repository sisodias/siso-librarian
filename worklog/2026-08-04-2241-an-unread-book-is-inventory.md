# Worklog: an unread book is inventory, not a library

Date: 2026-08-04T22:41:27Z (generated filename)
Thread: 78 books acquired, none of them read

## What I had verified, and what I had not

Schemas, counts, derivations, a served page. All plumbing. **Nothing had read a
single book.** So I read some.

The Library acquired **18th-century London Magazine runs (1742–1779)** and
**Victorian domestic-economy encyclopaedias**. Five serial volumes alone are
~2.2M words — that is what the "Essays" tier actually contained. The 1742
editorial voice on the reporting of parliamentary debates is genuine, sharp, and
now searchable.

## A defect I shipped an hour ago

**0 of 122,553 passages carried a heading.**

`isHeading` ran only on paragraphs that survived the `>=120`-char filter —
and **a heading is short by definition**. The two steps were in the wrong order,
so the heading test could never see a heading. On one book, 39 blocks matched
`isHeading` and all 39 were discarded before the test ran.

Marking headings during segmentation, before filtering: **0 → 122,414**
passages with headings, **12,223** distinct.

## Then I measured the quality instead of declaring victory

| | Headings | Passages |
| --- | ---: | ---: |
| substantive | 11,026 | 98,401 (**80.4%**) |
| noise | 1,197 | 24,015 (19.6%) |

The worst: **"SIR," and "SIR ," labelling 2,996 passages.** These books are full
of published letters, and an all-caps salutation passes every structural test.

Excluded **by name, not by length** — `Book  V.` is eight characters and *is* a
heading, so a blunt length rule would have thrown away real structure to remove
noise. After: salutations **2,996 → 0**, coverage held at 122,414.

## A corpus limitation I am recording, not hiding

18th-century typography uses the long s, and the OCR reads it as **f**:

| term | passages |
| --- | ---: |
| such | 6,214 |
| **fuch** | **5,846** |
| himself | 1,574 |
| **himfelf** | **1,964** |

**20 of 78 books affected.** A search for "such" misses roughly half the
matches; "himself" misses more than it finds.

Deliberately **not** fixed: normalising f→s would corrupt genuine words — fuel,
fund, fast — and is a transliteration decision about historical text, not a bug
fix. Written down so a reader knows the limit rather than trusting a silent
index.

Verify exit 0. Gate self-test 15 passed, 0 failed.
