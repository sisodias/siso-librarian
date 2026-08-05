# Worklog: six probes that printed verdicts nothing acted on

Three bugs today shared one shape — the input was **absent**, not wrong. I went
to teach the self-test that shape, and found the suite could not fail on it
either.

## The missing test class

Every existing case breaks an artifact by making it **wrong**: corrupt JSON, a
bad number, a table that does not exist. Not one **removes** the input so the
gate has nothing to read.

That is exactly today's blind spot. All three bugs would have passed a corruption
test:

```
rebuild-corpus     mktemp failed -> LOGFILE empty -> no skips found -> exit 9 on a correct corpus
enforce-retention  unreadable database -> counts empty -> "nothing to do", exit 0
audit-source-cov   empty sources/ -> checked_files 0 -> findings [], exit 0
```

A corrupt file and a missing file are **different tests**, and passing the first
says nothing about the second.

## The worse finding

While adding two starvation cases I checked whether a failing probe actually
fails the suite. It does not:

```
PROBE source-coverage starved of every source file — FAIL — forced
=== 15 passed, 0 failed ===        exit 0
```

`PASS`/`FAIL` are incremented only inside `check()`. The probes are `( … )`
**subshells** and cannot touch a parent variable. So **six probes have been
decorative for their entire existence** — printing verdicts nothing acted on.

That is the same defect they exist to catch, sitting inside the tool I use to
catch it. I have been reading their PASS lines all week as evidence.

## The fix

Two starvation cases, and every FAIL branch now `exit 1`s so the subshell
signals; a `probe_done` helper counts that status in the parent.

| | passed | failed | exit |
| --- | ---: | ---: | ---: |
| healthy repo | **23** | 0 | 0 |
| one probe forced to fail | 22 | **1** | **1** |

The first row went from 15 to 23 because the probes now count at all. The second
is the one that matters: the identical forcing gave `15 passed, 0 failed, exit 0`
before.
