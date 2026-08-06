# Worklog: four title rules chased one archive; the identifier prefix caught it in one

I wrote four title rules today — correspondence, street address, court filing,
photo view-note. **Each removed one shape of the same collection and revealed the
next.** The fifth batch still failed 17 of 27:

```
NO_TEXT: Colonial Bungalow, Flintridge, California
NO_TEXT: Craftsman Home, Flintridge, California
```

A house photograph with no view-note parenthetical, so rule four missed it. That
is the point at which I should have stopped adding rules and asked what they had
in common.

## The signal I should have looked for first

Group every `NO_TEXT` failure across all manifests by **identifier prefix**:

```
calcflh    0 usable of 128 attempted    ( 0%)
caggljhs  13 usable of 100 attempted    (13%)   — all 13 OCR of handwriting
```

**A title describes an item; a prefix describes the source** — and the source is
what has no text layer. One line of grouping beat four rules of pattern-matching.

## The fix

An empirical barren-collection block, learned from measured outcomes rather than
guessed from titles. Each prefix is recorded with its success rate over 100+ real
fetch attempts, so if a collection ever starts producing text, the claim can be
re-checked against the evidence that put it there.

## Result

| | |
| --- | --- |
| want-list | 1,449 → **1,445** items |
| excluded as not-a-book | **647** |
| barren-collection items remaining | **0** |
| ninth list | **complete** — 440 of 441 eligible on vault |

Probe **17 → 20 assertions**; emptying `BARREN_COLLECTIONS` gives **23 passed, 1
failed**.

## The lesson

**When a filter needs a fourth special case, the taxonomy is wrong.** Four title
patterns were four descriptions of one archive. One prefix was the archive.
