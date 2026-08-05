# Worklog: my own pre-push hook refused a push, and it was right

## First, a reporting failure of mine

The push was rejected. I read it as a transient remote error, retried, and
printed **"pushed"**. It had not pushed. My command ended in `tail -1`, which
dropped the line that mattered:

```
PUSH REFUSED: a suite failed (see above)
```

A pipeline ending in `tail` can hide the very line saying the operation failed.
I only caught it by counting unpushed commits afterwards and getting **1**.

## The real cause

Rebuild self-test, **8 passed 1 failed**:

```
FAIL  --check runs and changes nothing — rc=8, 1328 -> 1328
```

Exit 8 is `INCOMPLETE`. The index held 1,328 books while the fetch I had just run
put **1,528 texts** on disk. `--check` was **correct** — there really was a
200-book gap, and it said so.

## The defect was in the test

The case asserted `rc == 0` **and** `before == after`. Only the second is what
its name claims. `rc == 0` asserts *the corpus is currently up to date* — a fact
about the **world**, not about `--check`, and false during any fetch.

So the suite would fail on **every ingest**, training me to ignore it. That is
the exact failure mode I have spent today fixing, one layer up.

## The fix

Accept `rc 0` (up to date) and `rc 8` (INCOMPLETE, correctly reported). Reject
anything else, and mutation always.

| case | result |
| --- | --- |
| real mid-fetch state | **9 passed, 0 failed** |
| simulated mutation 1328 → 1300 | correctly **FAILS** |
| unexpected exit rc=9 | correctly **FAILS** |

Widening a test must not blind it; both negative cases were checked.

## And the morning's fix proved itself

The rebuild ended with the line that was **unreachable** this morning:

```
catalogue 1528, index 1527 — 1 book(s) yielded no usable paragraphs (OCR noise),
which accounts for the difference
```

That branch could not be taken while `mktemp` was silently failing. It fired on
the real pipeline, 0 mismatches.

## Corpus

**1,528 books, 2,374,999 passages, 187.7M words.**
