# Worklog: the 8.5 GB I carried for a dozen loops and never opened

Date: 2026-08-04T18:30:24Z (generated filename)
Thread: oracle-gate, the largest remaining item on root

## What it actually is

**13 git worktrees** of `SISO_Agency/apps/oracle-streaming`, made on
2026-07-20. Twelve sit at the same commit `764be5a75`, all detached.

The tell was there immediately once I looked: `.git` is a **103-byte file** —
a gitdir pointer — not a directory. And thirteen unrelated task IDs all
weighing exactly 667 MB is not thirteen artifacts, it is one artifact copied
thirteen times.

I had written "oracle-gate 8.5 GB still on root" in handover after handover
without ever running `ls` on it.

## A second 5.2 GB nobody is counting

`git worktree list` showed six more worktrees at a **literal \$HOME** path
*inside the source repo*:

```
SISO_Agency/apps/oracle-streaming/$HOME/oracle-gate/TASK-0253
```

A script quoted `$HOME` so it never expanded and git created the directory
literally. **5.2 GB.** I was auditing `~/oracle-gate` and would never have
found it — the registry did, because I asked git rather than the filesystem.

## What a size-based sweep would have destroyed

Six worktrees have uncommitted changes. `review-batch` alone has **572**:

| Worktree | Uncommitted | What |
| --- | ---: | --- |
| review-batch | 572 | 141 untracked, 346 modified, 152 deleted |
| TASK-0254 | 8 | new publish-recipe modules **with tests** |
| TASK-0710 | 7 | `StreamKeyExpiryWatcher` + tests, preflight-credentials |

Those untracked files exist **nowhere else**. Thirteen identically-sized
directories from one day, one of them named `TASK-NONEXISTENT`, is exactly the
shape that reads as disposable — and `du` would never have told me that four of
them held unpushed code with tests.

Classify by reading. Not by size, not by name, not by mtime.

## Preserved, then measured

Patches for tracked edits, tarballs for untracked files:
`librarian-vault/oracle-gate-uncommitted-20260804/` — **7.9 MB**.

Verified rather than assumed: extracted TASK-0710's tarball and diffed
file-by-file against the originals. **4 of 4 identical.**

Redundancy proven the same way — `git cat-file -t` confirms both
`764be5a75` and `62bdced87` are in the source repo, so the checked-out
content genuinely exists elsewhere. Equal file sizes were the hint; the object
store was the proof.

**The irreplaceable content is 0.06% of the 13.7 GB it sits in.**

## What I did not do

I did not remove anything. This is a repo I do not own, and `git worktree
remove` on someone else's unpushed work is not housekeeping. Decision 8 carries
the exact commands. The point of the last hour is that whenever that happens,
the 0.06% that mattered is already safe.

Verify exit 0.
