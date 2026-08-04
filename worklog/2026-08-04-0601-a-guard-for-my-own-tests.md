# Worklog: a guard for my own tests

Date: 2026-08-04T06:01:30Z (generated filename)
Thread: verification hygiene

## The pattern, twice in one session

Two tests damaged the thing they were testing:

1. **Cloned before committing** — the clone contained the pushed version, not my working-tree fix, and the probe reported `KeyError` on a field that existed locally. I briefly read it as "the change failed."
2. **`git reset --hard HEAD~1`** to undo a probe commit — which silently discarded an uncommitted fix along with it. Disagreement counts inverted and looked like the trigger working backwards.

Same root cause both times: **git operations as test scaffolding inside the live repo**. Both times the correction was identical — commit first, test in a throwaway clone — and both times I arrived at it only after being confused by the wreckage.

Remembering harder is not a fix. This is the third time tonight I have concluded that a habit needs to become a mechanism.

## The mechanism

`scripts/scratch-test.sh` runs any command against a disposable clone:

```
npm run scratch -- 'npm run verify'
npm run scratch -- --dirty 'node scripts/evaluate-refresh.mjs'
```

The default clones committed `HEAD` and **refuses outright if the working tree is dirty** — because a clone of HEAD would not contain your edit, which is exactly failure mode 1. It exits 65 and names the offending files. `--dirty` copies the working tree instead, for testing a change before committing it.

The scratch directory is removed on exit via `trap`, including on failure.

## Proved it contains damage, not just that it runs

A guard that has only been exercised on safe commands is a hypothesis. So I ran **the exact command that bit me**, plus a worse one, inside it:

```
git reset --hard HEAD~1 ; rm -f claims/*.json
  -> scratch claims now: 0
```

Live repo afterwards: **HEAD unchanged at `2e43a18`, all 10 claims present.** Byte-identical. The blast stayed inside.

## Why the refusal matters more than the isolation

Isolation stops damage. The refusal stops a *wrong answer*, which is worse — a test that quietly runs against stale code returns a green result you believe. Failure mode 1 produced no damage at all and still cost more time than failure mode 2, because I trusted the output.

| Measurement | Before | After |
| --- | --- | --- |
| guard against testing in live repo | none | `scratch-test.sh` |
| dirty-tree clone-of-HEAD | silent wrong version | refuses, exit 65 |
| destructive command reaching live repo | possible | contained, verified |
| npm scripts | 10 | 11 |

## Residual

It does not stop me *choosing* to run a destructive command directly in the live repo — nothing does, short of permissions I should not grant myself. It makes the safe path shorter than the dangerous one, which is the most a tool can do about a judgement error.

`--dirty` uses `rsync` of the working tree, so it copies build artifacts and any untracked scratch files. That is deliberate — it is meant to reproduce the working tree faithfully, warts included — but it means the scratch is not a clean-room build.
