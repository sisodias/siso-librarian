# Worklog: a gate that failed its own test, twice

Date: 2026-08-04T19:43:11Z (generated filename)
Thread: stop finding the same defect by accident

## The pattern

Twice today a checker read a **narrower source** than the thing it checked, and
both times I found it by luck rather than by a check:

1. `snap.bucket_counts[group][key]` audited nothing while reporting success.
2. Both dedup paths read `from book` after the catalogue gained a second
   source — the next want-list would have refetched all 78 IA books.

It is the wrong-key class again, and it is invisible for the same reason: **the
query succeeds**. No error, no exception, no empty result. Anything that only
watches for failures cannot see it.

So: `audit-source-coverage.mjs`, in `npm run verify --strict`.

## It failed its own test

I reintroduced the real bug on a scratch copy. The gate reported **0 findings,
exit 0**.

The cause is almost too apt. I had written `text.includes(secondary)` across
the whole file — and the comment I had left explaining the fix,
`// UNION book_external ...`, satisfied it while the SQL below still read
`from book` alone.

**A comment about the fix convinced the gate the fix was there.**

Fixed by stripping comments and testing only code.

## Then it cried wolf about itself

`verify` exit 6 on a clean tree. My `reads` regex tested **raw text** while
the sibling check tested **stripped code**, so this line in `gate-selftest.sh`

```
# the SQL below still read \`from book\` alone. Both the bug and the gate's own
```

registered as a real query. Prose discussing SQL is not SQL. Fixed by stripping
once and testing everything against the same result — a gate that cries wolf
about its own documentation gets muted, and a muted gate is a deleted gate.

## Proven in both directions

| Check | Result |
| --- | --- |
| fires on the real bug (scratch revert) | **exit 6**, names file and missing table |
| clean on the real tree | **0 findings**, 24 scripts |
| in the gate self-test | **14 passed, 0 failed** |
| cannot rot silently | asserts the sibling tables exist in the live catalogue |

That last row matters most. If someone renames `book_external`, the rule stops
matching reality — and a rule that matches nothing reports **zero findings**,
which looks exactly like health. So it checks the catalogue and reports the rule
itself as broken rather than reporting the repo as clean.

Verify exit 0.
