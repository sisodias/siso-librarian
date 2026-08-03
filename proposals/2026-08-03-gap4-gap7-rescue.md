# Proposal: rescue single-copy work and propose reclaim-only hygiene

Date: 2026-08-03
Thread: Gap 4 + Gap 7

## Gap

The charter identifies two concrete risks that are not claim-layer design work:

- Gap 4: irreplaceable work exists in single local copies: detached worktree commits under `oracle-streaming/.claude/worktrees/domain-batch-backend` and unpushed work in other repos.
- Gap 7: reclaimable machine hygiene candidates exist, but the hard rule is never delete; copy, rename, or propose.

This work beats further claim-layer hardening right now because it reduces direct loss risk on the internal SSD without mutating source worktrees or deleting reclaimable artifacts.

## Evidence before action

Machine health at start:

- `/`: 27Gi available
- load average: 1.31 / 1.37 / 1.40

Domain-batch backend inventory found 13 worktrees. Five HEAD commits are on no remote:

| Worktree | HEAD | Subject |
| --- | --- | --- |
| `TASK-0272-a3` | `21280f247` | TASK-0272: consolidate adapter routing registry |
| `TASK-0326-a1` | `43fc45bc9` | TASK-0326: add whole-pipe offline integration proof |
| `TASK-0390-a2` | `ee08a17b2` | TASK-0390: complete CAM4 VPS embed-own readback |
| `TASK-0668-a1` | `48fc3be5a` | TASK-0668: shed readback load at resource ceilings |
| `TASK-0776` | `1fbe5e39d` | TASK-0776: fail close uncertain CB offline proof |

Eight other backend worktrees have HEAD `80a0a64f3`, which is present on `origin/overnight-drain-20260720`, but many still contain dirty tracked/untracked changes.

Machine hygiene measurements:

- `/Applications/Docker.app`: 2.4G
- `/opt/homebrew/Cellar/llvm@20`: 1.4G (`llvm@20 20.1.8`)
- Literal misplaced `$HOME` directory under `oracle-streaming`: 5.2G

Repo inventory found many unpushed local commits. The largest/highest-signal examples:

- `~/SISO_Workspace`: 17 local commits not on remotes; includes June fixes such as `bd30704 fix: batch_engine AttributeError patch (cycle_2026-06-20 attr_instrument)`.
- `~/SISO_Workspace/SISO_Internal_Lab`: branch `lifelock-dev...origin/lifelock-dev [ahead 1]`, plus 14 local commits not on remotes across local branches.
- `~/.openclaw/agents`: 4 local commits not on remotes; nested OpenClaw agents also have ahead commits.
- `~/.claude`, `~/.codex`, `~/.hermes`, `~/.local/share/siso`, `~/.siso-agent-base`, `~/foundry-ops`, and `~/mini-ops-scripts`: each has one local commit not on remotes.

A search for literal `SEC-F16`, `SEC F16`, and `SEC_F16` under `SISO_Workspace`, `.openclaw`, and this repo found only the charter reference, so the June security fix is likely named differently in commit text or lives outside those searched paths.

## Action taken

No deletes. No branch rewrites. No pushes.

Copied a verified rescue bundle and dirty-worktree patch set to the vault:

`/Volumes/SISO-STORAGE-VAULT/SISO-VAULT/librarian-vault/gap4-gap7-2026-08-03-2116/`

Contents:

- `oracle-streaming-unremote-heads.bundle` — verified by `git bundle verify`; includes the five no-remote backend HEAD commits plus branches/tags needed for history.
- `MANIFEST.md` — source paths and commit list.
- Per-dirty-worktree `*.status.txt`, `*.diff`, and `*-untracked.tgz` files for 13 backend worktrees.

Verified after copy:

- vault rescue directory: 623M
- file count: 41
- `git bundle verify`: reports bundle is okay and records complete history.

## Proposed next action

1. Create durable local refs or push private rescue refs for the five no-remote backend heads, e.g. `refs/rescue/domain-batch-backend/<task>`, then verify `git branch -r --contains` or equivalent remote refs.
2. Copy or bundle the other unpushed repos before any cleanup, prioritizing `~/SISO_Workspace`, `~/SISO_Workspace/SISO_Internal_Lab`, and `~/.openclaw/agents`.
3. Only after rescue: propose reclaim operations for Docker.app, llvm@20, and the literal `$HOME` tree. Reclaim estimate from measured sizes is about 9.0G, but actual delete/uninstall requires explicit approval because the charter says never delete.

## What would prove this wrong

If the bundle cannot be cloned/fetched on another machine, this did not rescue the work. The current local `git bundle verify` proves object completeness in the source repo, not cross-machine restoration.
