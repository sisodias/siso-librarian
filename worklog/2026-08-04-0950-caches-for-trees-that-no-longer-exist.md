# Worklog: caches for trees that no longer exist

Date: 2026-08-04T09:50:40Z (generated filename)
Thread: root disk — the 4 GB I had not looked at

## The find

`~/.pi-lens` is 4.0 GB. Of that, **3.2 GB is `projects/*/cache`** — 41
directories of `knip.json` and `project-snapshot.json`, analysis output for
worktrees under `.claude-worktrees`.

**That directory does not exist anywhere under `~/SISO_Workspace`.**

So these are derived artifacts describing source trees that are gone. They
cannot be regenerated (the input is deleted) and cannot be used (nothing points
at them). Unlike oracle-gate, there is no uncommitted work here — the caches
*are* the bulk.

## The check I got wrong first

My first pass reconstructed each source path by replacing hyphens with slashes
in the cache directory name, and reported `alive=0 dead=60`.

That number was right by accident. The transform is unreliable — **hyphens are
ambiguous** between path separators and real characters in names like
`domain-batch-backend-TASK-0326-a1` — so it would have reported "dead" for a
worktree that existed under a hyphenated name.

Sixth instance of the wrong-key pattern this session. I caught it because the
output looked *too* clean, and replaced it with an actual `find` for
`.claude-worktrees`, which is what established the caches are orphaned.

## Separating history from bulk

```
session history   0.5 MB   change-log.jsonl, turn-state.json, recent-touches.json
cache            3.2 GB    knip.json, project-snapshot.json
```

A clean split, and the small half is the one worth keeping. Preserved 133 files
to the vault and verified the tarball lists before moving anything. Then
quarantined the 41 cache directories by rename.

```
.pi-lens   4.0G -> 804M
root       18Gi -> 18Gi     (unchanged — a rename frees nothing)
```

| Measurement | Value |
| --- | ---: |
| cache dirs quarantined | 41 |
| history files preserved | 133 (522 KB) |
| bytes deleted | **0** |
| total now safely reclaimable | **13 GB** |

Verify exit 0.

## Where this leaves the disk

Three loops of this work have produced **13 GB in one quarantine directory**,
each item verified on the vault and provably unreferenced, with a README giving
the exact restore command and the exact reclaim command.

Root is still 18Gi because I have deleted nothing, and that is correct: C1 is
absolute and reclaiming is Shaan's call. But the shape has changed — deleting
13 GB is now a one-line decision with no investigation attached, instead of a
question about what might break.
