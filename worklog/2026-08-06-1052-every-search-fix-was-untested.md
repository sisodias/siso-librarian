# Worklog: every search fix I made today was untested

Search gained **ranking**, an **overlap exclusion**, a **candidate cap** and an
**exit code** today. Exactly one self-test case touched search, and it asserted
only that a query returns *something*.

The next refactor could have undone any of it silently — which, given I broke
this same file three times today with a stray backtick, is not hypothetical.

## My first ranking case was decoration

It counted `[term]` highlight markers in the snippets. Then I deleted an
`ORDER BY` and ran it:

```
PASS  search highlights matched terms in ranked output
=== 12 passed, 0 failed ===
```

**Highlighting has nothing to do with rank.** The case name overclaimed what it
tested — the same shape as the six probes that printed verdicts into a void
yesterday, and I walked straight into it while writing the fix for that class.

The real version compares the CLI's top result against the bm25 top result
computed independently in SQL, *and* against the rowid-first row:

```
PASS  search returns the BM25-ranked top result (rowid 49, not 1)
```

## Each case proven to fail on its own defect

| case | defect injected | result |
| --- | --- | --- |
| ranking | `ORDER BY` removed | **FAIL** — "CLI gave rowid 1, bm25 says 49" |
| exit code | `exit(65)` → `exit(0)` | **FAIL** — "got exit 1" |
| highlighting | `snippet()` replaced | **FAIL** — "no [term] markers" |

Suite: **9 passed → 12 passed, 0 failed**.

## The lesson, restated because I keep relearning it

**A test that passes on a healthy repo proves nothing.** I checked all three
against their own defect *before* recording them — which is the only reason I
caught that one of the three was decoration.
