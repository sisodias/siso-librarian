# Worklog: four hops from a deleted script

Date: 2026-08-04T13:29:18Z (generated filename)
Thread: why GQ-005 has no movement baseline

## Following the blocker down

Last loop I noted `momentum.sqlite` stopped recording on 2026-07-11 and left it
as a fact. This loop I asked why.

```
com.siso.foundry-momentum     loaded, exit status 1, daily at 04:10
  sqlite3.OperationalError: no such table: repos
```

It failed again at 04:10 **today**, and every night for two weeks.

Not a renamed table. Its source, `~/Projects/github-learnings/repos.db`, is
**0 bytes** — and so is the only other file in that directory. The tree is empty.

Upstream of that:

```
com.siso.gh.learnings    exit 78
  program: ~/Projects/github-learnings/venv/bin/python3     MISSING
  script:  ~/Projects/github-learnings/fetch_and_analyze.py MISSING
```

**A deleted script and its venv** -> repos.db never repopulated -> momentum
collector fails nightly -> momentum.sqlite frozen at three days -> GQ-005 has a
window in which only 29 repos moved and the top category is 92% one repository.

Four hops from a missing file to a Great Library question with no baseline.

## Then I checked the rest

My escalation said *"there are five loaded, and I have not checked their exit
statuses."* Writing that sentence obliged me to check.

```
exit 0  (healthy)                 15
exit 78 (path does not exist)     15
exit 127 (command not found)      11
exit 126, 2, 1, 7, -15            10

36 of 51 SISO/foundry jobs failing
```

## Why this stayed invisible

`launchctl list` renders a failing job and a healthy one **identically** unless
you read the status column. Exit 78 is the quietest: launchd cannot start the
program at all, so there is no crash, no traceback, and the log file stays at
0 bytes — which looks exactly like a job that had nothing to say.

That is the same shape as every silent skip I have found in my own gates this
session: **the absence of an error is not evidence of success.**

| Measurement | Value |
| --- | ---: |
| SISO/foundry launchd jobs | 51 |
| exiting 0 | **15** |
| failing | **36** |
| consecutive failures of the momentum job | 14 |
| hops from deleted script to GQ-005 | 4 |

Verify exit 0.

## What I am not claiming

**36 failing jobs is a count, not 36 defects.** Some are plausibly disabled on
purpose, superseded, or one-shot runs carrying a stale code. I traced exactly
one chain to its root and did not trace the other 35 — reporting the count with
its exit codes is honest; calling it 36 broken things would not be.

Nothing repaired. These are operational jobs, not Library artifacts, and
reconstructing a deleted script means guessing at someone else's pipeline.
