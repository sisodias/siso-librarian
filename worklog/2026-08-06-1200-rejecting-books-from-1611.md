# Worklog: the rights filter was rejecting books from 1611 on a wording technicality

One turn ago I examined this same filter, found its 86% rejection rate **correct**,
and wrote down what would change my mind:

> a `bare-assertion` bucket dominated by pre-1929 material, where age settles the
> question independently of metadata wording.

The next want-list produced exactly that. Writing down the falsifier is what made
this findable — I checked the decade distribution first instead of re-deriving
the whole argument.

## The finding

| list | pre-1929 share of `bare-assertion` |
| --- | --- |
| eighth (Physics, Maths, Engineering) | **15 of 2,761** — the filter was right |
| ninth (Gardening, Navigation, Mining, Architecture) | **538 of 1,076 (50%)** |

Range **1611–1928**, including 1920s periodicals:

```
1921  California Garden, Vol. 0013, No. 003, September 1921
1923  California Garden, Vol. 0014, No. 007, January 1923
```

`classifyRights` sees only the rights **string**. So a 1611 book whose metadata
says a plain `"Public Domain"` graded identically to a 1994 engineering text with
the same string — and both were excluded.

## The fix

A new **`age-settled`** grade, applied where both the year and the grade are
known. Deliberately narrow:

- upgrades **only** `bare-assertion` — never `none`, never `not-a-designation`
- requires a finite year; **no year means no upgrade**
- a **separate grade**, not a widening of an existing one, so every manifest
  still records exactly which evidence admitted each book

## Measured

**154 → 692 eligible** of 1,945. A 4.5× increase.

| check | result |
| --- | --- |
| `age-settled` year range | **1611–1928** |
| any with year ≥ 1929, or missing | **0** — the guard holds |
| pre-1929 left in `bare-assertion` | **0** |
| what remains in `bare-assertion` | 1980s–2010s: 165 from the 2000s, 168 from the 1990s |

That last row is the one that matters: the modern uploads the grade exists to
catch are **still excluded**. This admits a real population without loosening the
thing that does the work.
