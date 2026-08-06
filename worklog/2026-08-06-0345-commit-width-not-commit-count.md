# Worklog: two suites wanted opposite things from the same repo

## The bind

Both suites build a two-commit scratch copy. They need **opposite** behaviour
from `evaluate-refresh` in it:

- the **gate self-test** backdates the ledger to 2020 and needs the gate to
  **evaluate**, so it can detect staleness
- the **load-bearing suite** needs the gate to **skip**, or every trigger fires
  on synthetic history and the baseline fails

No commit-*count* threshold can satisfy both, and I tried two:

```
< 10 commits  -> gate self-test skipped: 5 cases "GATE DID NOT FIRE"
== 1 commit   -> load-bearing BASELINE FAILED in 21s
```

Each fix broke the other suite. That is the signature of measuring the wrong
property.

## The real signal is commit WIDTH

```
real commits here:      4, 7, 8 files
scratch import commit:  531 files — the whole repo
```

Not close. And it is the *right* property, not merely a working one: **a commit
that rewrites everything cannot distinguish "this path changed" from "this path
exists"** — which is precisely what makes such a history unusable for trigger
evaluation.

Rule: a root commit touching more than half the tracked files is an **import**,
not a history.

## And the self-test's own setup changed

Its scratch repo now commits **one file first**, then everything else. A narrow
root commit gives the gate a history it can reason about — rather than demanding
the gate overlook a condition that genuinely defeats it.

That is the better shape of fix: I made the *fixture* realistic instead of making
the *gate* blinder.

## Result

| | |
| --- | --- |
| gate self-test | **23 passed, 0 failed** |
| gates load-bearing | **10 load-bearing, 0 not** (was 9) |
| all suites | **5 pass, 0 fail** |
