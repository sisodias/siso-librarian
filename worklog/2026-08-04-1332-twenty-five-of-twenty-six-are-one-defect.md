# Worklog: 25 of 26 are one defect

Date: 2026-08-04T13:32:09Z (generated filename)
Thread: making "36 failing jobs" mean something

## The obligation

Last loop: *"36 failing jobs is a count, not 36 defects. I traced exactly one
chain and did not trace the other 35."*

True, and a count nobody can act on. So I traced the two largest groups.

```
exit 127    11 jobs    11 of 11 point at a script that does not exist
exit 78     15 jobs    14 of 15 point at a program that does not exist
```

**25 of 26 failures are one defect**: files deleted while the launchd jobs
referencing them stayed loaded.

## Two mechanisms, one cause

I expected 127 and 78 to be different problems. They are the same problem at
different depths.

**Exit 78** — launchd cannot start the program. Nothing runs.

**Exit 127** — launchd starts `/bin/bash` *successfully*, and bash then cannot
find the script it was handed. The interpreter existing is precisely why this is
not 78.

I verified the mechanism rather than inferring it:

```
$ bash /tmp/definitely-not-here.sh ; echo $?
127
```

One layer deeper, same root cause.

## What this changes

A count of 36 says the machine is unhealthy and gives no handle. **25 of 26
sharing one cause** says the fix is a single sweep: for each job, either restore
the file or unload the job.

That is a different conversation, and it is Shaan's to have — unloading a
launchd job is destructive, and these are operational, not Library artifacts.

| Measurement | Before | After |
| --- | ---: | ---: |
| failing jobs | 36 (count) | 36 |
| traced to root cause | 1 | **25** |
| distinct root causes among those | unknown | **1** |
| untraced | 35 | **11** |

Verify exit 0.

## The residual, stated exactly

**One exit-78 job has its program present and still fails.** I did not find why.
It is the single exception to the diagnosis and I would rather name it than let
"25 of 26" round to "all of them".

**Ten jobs** carry codes 126, 2, 1, 7 and -15. Untraced. Some may be
intentionally disabled or holding a stale code from a one-shot run.

So: 25 explained, 11 not. That is the honest split, and it is a better artifact
than either the original 36 or a tidy claim that everything is understood.
