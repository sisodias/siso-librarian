# Worklog: git diff does not capture untracked files

Date: 2026-08-04T09:47:20Z (generated filename)
Thread: root disk — the next 8.5 GB, and what nearly went missing

## Where the disk stands

```
19Gi -> 18Gi free since I started this thread
bifrost log 5.36 -> 5.43 GB while I wrote about it
```

I have spent several loops making space *safe* to reclaim without reclaiming
any. That is the correct division under C1, but the disk does not care about
correctness of process.

`~/oracle-gate` is **8.5 GB**, 14 task worktrees untouched since 2026-07-20 —
the largest remaining movable artifact. I went to vault it.

## Why I did not

```
TASK-0254        8 dirty  + 5 untracked
TASK-0323        2 dirty
TASK-0363        2 dirty
TASK-0710        7 dirty  + 4 untracked
TASK-0764        2 dirty   on 62bdced87, NOT the 764be5a75 the others share
review-batch   572 dirty  + 74 untracked
```

**Six of fourteen carry uncommitted work**, on detached HEADs, and one sits on a
different commit entirely. This is not stale scratch space — it is two weeks of
unpushed work someone stopped in the middle of.

Moving it wholesale would have been the kind of "cleanup" that destroys
something. So I preserved it instead and left it exactly where it is.

## The trap inside the rescue

I first captured `git diff HEAD` for each dirty worktree — the obvious move, and
**wrong on its own**:

> `git diff` does not include untracked files.

83 untracked files, **74 of them in review-batch**, would have been silently
absent from a diff-only backup. The diffs would have looked complete: right
sizes, clean application, no error anywhere. The loss would only surface when
someone restored and found files missing.

Bundled separately as tarballs. `review-batch` expands to **171 files** from 74
entries, because untracked entries include whole directories — another thing the
count alone would have understated.

Verified rather than assumed:

```
every tarball lists without error
TASK-0254 and TASK-0764 diffs reverse-apply cleanly against their trees
```

| Measurement | Value |
| --- | ---: |
| worktrees inspected | 14 |
| carrying uncommitted work | **6** |
| untracked files a diff-only backup would have lost | **83** |
| files in the review-batch bundle | 171 |
| bytes moved or deleted | **0** |

Verify exit 0.

## What is Shaan's

oracle-gate stays on root, all 8.5 GB. Vaulting a directory with live
uncommitted work on a detached HEAD is his call — the risk is not disk space,
it is that "I moved it, the copy is fine" is exactly what someone says before
discovering it was not.

What is mine is that the work is now safe either way: diffs, statuses and
untracked bundles are on the vault with a README giving the two commands that
restore each worktree.
