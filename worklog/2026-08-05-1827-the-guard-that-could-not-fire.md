# Worklog: a guard that could not fire

Thread: the rebuild to 1,329 books exited 9 on a corpus that was correct.

## The symptom

```
MISMATCH: catalogue 1329, index 1328 — a manifest is missing or was overwritten
```

The corpus was **fine**. `b19602923` is 68,649 characters of scan noise —
catalogued, and correctly un-indexed because no block reaches 120 characters.
Verified: 1 row in `book_external`, 0 in `book_ext`. That one-book gap is exactly
what the guard's skip branch exists to forgive.

## Replaying it by hand passed

`1328 + 1 = 1329`. `grep -c` on the logfile returned 1. Every input the guard
reads was correct **when I checked it afterwards** — which is what made this
worth chasing rather than patching.

## Root cause

Look at the filename the rebuild left behind:

```
/tmp/rebuild-index-XXXXXX.log      <- the X's, unexpanded
```

**BSD `mktemp` expands X placeholders only at the END of a template.** The
`.log` suffix made the whole thing literal.

The first rebuild created that literal path. Every rebuild after it:

```
mktemp: mkstemp failed on /tmp/rebuild-index-XXXXXX.log: File exists
```

`mktemp` exits 1, so **`LOGFILE` becomes the empty string**. Then `tee ""`
writes nowhere, `grep -c 'NO PARAGRAPHS' ""` finds nothing, `skipped=0`, and the
branch that forgives an OCR skip becomes **unreachable**. The log I inspected
afterwards was the *first* run's leftover — which is why the hand replay passed.

## The shape, again

```bash
skipped=$(grep -c 'NO PARAGRAPHS' "$LOGFILE" 2>/dev/null || echo 0)
```

`|| echo 0` turned a **broken input** into a **plausible answer**. Same shape as
the `|| true` that disabled the verify chain: a default that hides a broken input
is not a default, it is a silencer. `skipped=0` from a lost logfile was
indistinguishable from `skipped=0` meaning nothing was skipped.

## The fix

Trailing X's only, plus a hard check that `LOGFILE` is non-empty and exists —
mktemp failing is now fatal instead of silent.

Then the real repair: **read the durable source first.**
`corpus_stats.skipped_no_paragraphs` is written by the builder into the index
itself and survives a lost logfile. A `-1` sentinel distinguishes *not recorded*
from *zero skips*; the log is the fallback, and it says so when it answers.

## Verified both directions, on the real script

| case | result |
| --- | --- |
| correct corpus, **empty logfile** | **exit 0** — proves it reads `corpus_stats` |
| 5 books genuinely deleted | **exit 9** MISMATCH — still discriminates |

The first case is the one that matters: it passes *because* the logfile is
useless, which is the condition that broke it.

## Corpus

**1,329 books, 2,025,511 passages, 164.9M words** — past two million passages.
