# Worklog: the limit I declared permanent

Date: 2026-08-04T22:56:15Z (generated filename)
Thread: long-s OCR, "deliberately not fixed"

## I gave a reason I had not tested

Last turn: *"normalising f→s would corrupt genuine words — fuel, fund, fast."*
Plausible, and stated as settled without a single query.

So I queried it. **35,738 passages contain "from", 5,569 "four", 2,599 "full".**
Blind substitution yields *srom, sour, sull* — corruption at scale. **The caveat
was right. Stating it untested was still wrong**, and today has punished that
exact move repeatedly.

But "blind substitution is unsafe" is not "this cannot be fixed".

## The rule

Convert a word only when the **f-form is not in the dictionary** and some
**s-substitution is**. Multi-f words need a subset search: `firft` → first,
`himfelf` → himself, `fatisfaction` → satisfaction. `/usr/share/dict/words`
is the authority — not my judgement about which words look archaic.

Written to a **separate** `passage_modern` table. The original text is
untouched: a reader who wants the 1742 page still gets the 1742 page.

## Result

**49,710 of 122,553** passages contained long-s spellings. **9,080** distinct
words converted.

| term | original | modern | |
| --- | ---: | ---: | --- |
| such | 6,060 | **11,717** | +5,657 |
| these | 9,008 | **13,742** | +4,734 |
| those | 5,304 | **9,837** | +4,533 |
| must | 5,902 | **7,926** | +2,024 |
| himself | 1,545 | **3,508** | +1,963 |
| from | 34,291 | 34,291 | **intact** |
| four | 5,407 | 5,407 | **intact** |
| fuel | 290 | 290 | **intact** |

Recall roughly doubles on long-s words, and **every genuine f-word is exactly
intact**.

## Three bugs of my own, and one near-false finding

**E2BIG** — 2,000 passage bodies exceeded the argv limit. SQL now goes on stdin.

**Malformed SQL** — bodies contain embedded newlines, so splitting sqlite output
on `\n` shreds one row into fragments. Same defect that broke 40 titles into
154 pieces earlier today. Fixed with `json_group_array`, making sqlite
responsible for escaping its own output.

**A corruption finding that was not real.** `from` appeared to drop
35,738 → 34,291, and I nearly reported the rule as unsafe. The original index
covers **heading + body**; the modern index covers **body only**. The row I had
"lost" carried `LETTERS FROM THE CONTINENT,` as its *heading*. Column-scoped:
**34,291 vs 34,291.** My comparison was broken twice before the numbers agreed.

`applyEdit` earned its keep: it **refused** a patch whose anchor did not match
— a literal `\x1f` in my heredoc was not the real separator byte — instead of
silently doing nothing, which is precisely the failure it was built for.

Verify exit 0. Gate self-test 15 passed, 0 failed.
