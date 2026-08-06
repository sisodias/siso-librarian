# Worklog: my own filters silently disabled five self-test cases

The hook refused a push: **gate self-test FAIL**, five cases reporting `GATE DID
NOT FIRE`. Every one was caused by a filter I had added earlier the same day.

Each filter was **correct for the case it was written for**, and wrong the moment
it was applied to every check.

## The five, each measured rather than guessed

**1. A skip threshold of `< 10` commits** in `evaluate-refresh` — broke five
cases at once. The self-test builds a scratch repo with exactly **two** commits
on purpose ("two minimum, because the gate excludes HEAD deliberately"), so a
ten-commit floor made every case skip. The threshold is now **one** — the only
count that genuinely cannot be measured, since the gate compares against `HEAD~1`.

**2. A bare date cutoff** classing anything before 2026-08-05 as debt — broke
four cases that plant falsified numbers in files dated 2026-08-04. **A falsified
number is not stale merely because the file it sits in is old.** Now scoped to
the one check the debt is actually made of.

**3. `metrics-reproducible-not-derivable` in the debt set** — broke the
claim-reader case. The real debt is 23 `worklog-timestamp` findings and nothing
else.

**4. `--skip-sqlite` in two cases** — their planted number derives *via* sqlite,
so skipping it made the defect report `source_missing`: **unverifiable rather
than wrong**, and the gate correctly declined to fire. The case was asserting a
defect it had made invisible.

**5. "unverifiable never gates"**, added hours earlier for locked databases —
broke the corrupt-source probe. A corrupt file and a busy database both reached

```js
try { derived = derive(d); } catch { derived = null; }
```

and collapsed to the same status. That bare `catch` is the same
information-destroying shape as `|| echo 0`. Now the reason survives: a **parse
error** is `source-corrupt` and **gates**; a lock or a missing file stays
`unverifiable` and does not.

## Three wrong guesses I measured and discarded

Chasing cause 3 I proposed `explained < count`, then `metric_count_findings`,
then `declaredChecked`. Each was **identical** broken and healthy. Only
`metrics-reproducible-not-derivable` moved — 2 to 0. Breaking the claim reader
makes the audit check **less** and report nothing, which no exit code can
express, so it is asserted directly now.

## Verified

| | result |
| --- | --- |
| verify chain | exit 0 |
| gate self-test | **23 passed, 0 failed** |
| rebuild self-test | 9 passed, 0 failed |
| corrupt source | **exit 3** |
| genuinely locked database | **exit 0** |

## The lesson

**A filter is a claim about which findings do not matter, and it needs the same
proof as a finding.** I added five in one day with no negative test on any of
them, and every one quietly narrowed what the gates could see.
