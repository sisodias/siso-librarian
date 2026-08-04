# Worklog: durable rescue refs, and proving the bundle actually restores

Date: 2026-08-04 00:10
Thread: Gap 4 — irreplaceable work in single copies

## What changed

Two things, and the second one settles a question the previous rescue worklog left open honestly.

First, the five backend commits that live on no remote now have durable refs under `refs/rescue/domain-batch-backend/`. Until now they existed only as detached worktree HEADs, which is the fragile case: a `git gc` or a worktree prune can collect a detached HEAD, and the work is gone. A ref anchors the object.

Second, the vault bundle was tested by actually restoring from it.

## Before / after

| Measurement | Before | After |
| --- | ---: | ---: |
| commits on no remote | 5 | 5 |
| durable rescue refs | 0 | 5 |
| bundle restore proven independently | no | yes |
| objects recovered in restore test | 0 | 79,459 |

## The refs

| Ref | Commit | Subject |
| --- | --- | --- |
| `TASK-0272-a3` | `21280f247` | consolidate adapter routing registry |
| `TASK-0326-a1` | `43fc45bc9` | add whole-pipe offline integration proof |
| `TASK-0390-a2` | `ee08a17b2` | complete CAM4 VPS embed-own readback |
| `TASK-0668-a1` | `48fc3be5a` | shed readback load at resource ceilings |
| `TASK-0776` | `1fbe5e39d` | fail close uncertain CB offline proof |

Every one re-derived with `git branch -r --contains` returning zero remote branches, then anchored with `git update-ref`, then confirmed with `git cat-file -t` returning `commit` for all five. Purely additive: no branch was moved, nothing was deleted, no history rewritten, nothing pushed.

## Closing the open question

The 2026-08-03 rescue worklog said plainly: *"If the bundle cannot be cloned/fetched on another machine, this did not rescue the work. The current local `git bundle verify` proves object completeness in the source repo, not cross-machine restoration."*

That was the right caveat and it was still outstanding. So I cloned the bundle into a scratch bare repo and asked the restored repo — not the source — whether the work is there.

It is. The clone succeeded, all five commits resolve as type `commit` with their correct subjects inside the restored repo, and file trees read back out of `1fbe5e39d`. 79,459 objects in pack.

That is a genuine restore path, not a checksum that agrees with itself.

## What I got wrong earlier

I had been treating the bundle as the rescue. It was half of one. A bundle nobody has restored from is a hypothesis about a bundle. The refs and the restore test are what make the claim real, and both were cheap — the whole thing took under a minute once I stopped assuming and ran it.

## Residual risk, stated plainly

The refs are local to this machine, and the bundle is on the same vault as everything else. Neither is offsite. This removes the "silently garbage-collected" failure mode and proves recoverability; it does not survive losing the mini and the vault together.

The natural next move is pushing these as private rescue refs to a remote, which needs a decision about which remote and whether that history should be public — a genuine branch point rather than something to assume. The SEC-F16 June fix is also still unlocated; a literal grep for `SEC-F16`, `SEC F16`, and `SEC_F16` across `SISO_Workspace`, `.openclaw`, and this repo found only the charter's own reference, so it is named differently in commit text or lives somewhere not yet searched.
