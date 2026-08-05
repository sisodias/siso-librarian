# Worklog: synthetic history burned me three times

Date: 2026-08-05T04:16:30Z (generated filename)
Thread: a lesson I documented three times and never mechanised

## Three wrong answers, same cause

1. The gate self-test once ran **without `.git`**, and the refresh evaluator
   reported all ten entries fresh — maximum confidence from zero information.
2. `gates-are-load-bearing.sh` hit **BASELINE FAILED**, because one synthetic
   commit touches every watched path at once.
3. Last turn my trigger test **fired all three triggers**, and I briefly read it
   as my fix not working.

Each cost a round trip. I wrote the lesson down each time and prevented nothing.

## The surface is small

```
scripts building synthetic history : 3
gates reading git history          : 1   (evaluate-refresh.mjs)
```

So the rule is narrow and checkable, which is what makes it worth mechanising
rather than remembering.

## What I found looking properly

`gate-selftest.sh` case 7 **does** run the evaluator against synthetic history
— and that is **correct**. It backdates the ledger so triggers fire against the
scratch repo's own commits, and its comment said so.

But the case depends on the base commit touching a **watched** path, and nothing
stated or checked that. I narrowed `new evidence source` to contract files
**this same session**. Narrow far enough and case 7 stops firing *for the right
reason* and passes *for the wrong one* — the defect class that has cost the most
here, arriving through a change I had already made.

## Fixed twice over

The dependency is now written into the case **and** enforced by a probe:

```
normal                                  PASS (3 watched path(s) present)
schemas/, contract, claims/ removed     FAIL — "case 7 would pass having tested nothing"
```

A comment asking the next person to re-check is a comment. **The probe fails
loudly instead.**

Verify exit 0. Suites 3 pass, 0 fail; gate self-test 15 passed.
