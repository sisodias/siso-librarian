# Worklog: testing the one script that deletes

Date: 2026-08-05T00:03:56Z (generated filename)
Thread: the destructive path nothing covered

## The gap

`enforce-log-retention.sh` is the **only** script in this repo that removes
data. Every other gate has a self-test case proving it fires. This one had
**zero** — and it had already destroyed the archive it depends on, which I found
through a gate reading *metrics*, not through anything testing the script.

## My first attempt was decoration

Six cases, all green. Then the test that mattered: **delete the script and
re-run**.

```
5 passed, 1 failed
```

Four cases asserted things about sqlite and about fixtures I had built myself.
They would pass on an empty repo. This is the same defect I *removed* a guard
for earlier today — **a check that cannot detect its own target reads as
coverage**, and coverage that is not there is worse than none.

## The rewrite

Every case now drives the real script through `LOG_DB_OVERRIDE` and
`SLICE_OVERRIDE` against temp fixtures. A destructive path that can only be
tested by pointing it at the real database is a path that never gets tested.

With the script deleted, the result now **inverts**:

```
1 passed, 5 failed
```

## A real bug it found immediately

Two cases failed on a clean fixture: the script **evicted nothing and pruned
nothing**.

A leftover guard compared the refreshed slice against **live** and refused at
1/5. After any successful eviction, live and slice *always* differ — that is
what an archive is.

**The script had run once. Every subsequent run would have refused forever.**
Fixed to re-probe the slice directly: does it *answer*, not does it agree with a
source that has moved on.

| | |
| --- | --- |
| retention self-test | **6 passed, 0 failed** |
| with the script deleted | **1 passed, 5 failed** |
| wired into | `gate-selftest.sh` + `npm run retention:selftest` |
| verify | exit 0 |
