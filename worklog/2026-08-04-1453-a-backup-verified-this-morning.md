# Worklog: a backup verified this morning

Date: 2026-08-04T14:53:48Z (generated filename)
Thread: keeping the reclaim decision a one-liner

## Why re-verify something I already checked

Root is at **17Gi** and the low projection is under a day. If Shaan decides to
reclaim the 13 GB, that has to be a one-line command — not a command plus an
investigation into whether the safety evidence still holds.

**A backup verified this morning is a claim about this morning.** So I re-took it.

```
passages_v1.sqlite.gz
  local   9.50 GB
  vault   9.50 GB
  sha256  cef7fe1d...f63e1c   MATCH (re-hashed the VAULT copy, not the local one)

pi-lens caches
  41 cache dirs quarantined
  133 history files list cleanly from the vault tarball
  .claude-worktrees still absent  -> caches remain unregenerable
```

All three conditions hold. **13 GB remains provably safe to delete.**

Re-hashing the vault copy rather than the local one matters: hashing the local
file would confirm the file I am about to delete is unchanged, which is not the
question. The question is whether the copy that survives is still good.

## My own repo is not the problem

```
.git       8.3M
worklog     556K
metrics     452K
total      ~9 MB
```

I had wondered whether my own writing was a factor. It is not — 9 MB against a
7.09 GB gateway log. The cost is per-request logging, which I cannot prune.

## The gate caught my own edit

Verify exited 2 on the first run:

```
GQ-001   recorded fresh, derived stale
trigger  "approved action status change"
commit   6ed18ce GQ-001: withdraw an un-refreshable ratio
```

**Correctly scoped.** That trigger is bound to `entry.claim_packet`, so rewriting
GQ-001's position fired it for GQ-001 alone and left the other six untouched —
which is exactly the narrowing I made two days ago after it fired on all ten at
once.

Re-derived grounding first (30/30), then re-checked. Never bump a timestamp
without re-reading the evidence.

| Measurement | Value |
| --- | ---: |
| root free | 17Gi |
| quarantine still reclaimable | **13 GB** |
| vault checksum | MATCH |
| librarian repo footprint | ~9 MB |
| grounding ranges | 30/30 |

Verify exit 0.
