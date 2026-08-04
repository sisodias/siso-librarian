# Worklog: a gate that cried wolf, and a test that ate my fix

Date: 2026-08-04T05:58:32Z (generated filename)
Thread: escalation queue + drift triggers

## Automating the mailbox

The laptop has flapped four times today. I have been polling it by hand each loop, which means the queue drains when I remember rather than when the link returns.

`scripts/mailbox-flush.sh` now handles it: messages sit in `outbox/`, get delivered when the link is up, and move to `outbox/sent/` rather than being deleted so the repo keeps the record. **Delivery is confirmed by `test -s` on the remote file**, never by trusting an exit code — the charter's standing lesson.

Tested the success path against `localhost` with a scratch target: delivered, landed at 1,033 bytes, moved to `sent/`, and a rerun reported nothing queued. Tested the offline path against the real peer: message stays queued, exit 0, explicitly *not* an error.

The disk warning from decision 6 is queued and will go out on its own.

## The gate that cried wolf

`npm run verify` then failed with **all ten claims stale**, every one citing a "schema change" from commit `9a3be54`.

That commit changed `scripts/verify-claim-packets.mjs` — a **gate**, not a schema. My trigger mapped "schema change" to both `schemas/` and the verifier, so hardening a checker marked every claim in the repo as needing re-verification.

All 21 grounding ranges resolved. Nothing had actually moved.

This is worse than a nuisance. A trigger that fires on routine maintenance teaches you to dismiss it, and I have spent tonight arguing that a gate which always screams gets switched off. Narrowed to `schemas/` only: a checker getting stricter is not a reason to doubt what it checks.

## The test that destroyed the fix

Verifying the narrowed trigger, I committed a probe schema change and then ran `git reset --hard HEAD~1` to undo it.

That **wiped my uncommitted fix**, silently. The counts inverted — 0 disagreements before the revert, 10 after — and for a moment the result looked like the trigger behaving backwards.

It was not. `reset --hard` discards working-tree changes, and my edit was still uncommitted. I checked the file rather than theorising about the numbers, found the old line restored, and reapplied it.

**Second time tonight a test has damaged what it was testing** — the earlier one cloned before committing and tested the wrong version. Same root cause: using git operations as test scaffolding in the live repo. Both times the fix was to commit first, then test in a throwaway clone.

## Proving the narrowed trigger still works

In an isolated clone, a real schema change plus one later commit: **10 disagreements**, all citing the schema commit. Firing correctly.

It needs the later commit because `HEAD` is excluded — an earlier fix so a claim is not invalidated by the commit that creates it. Correct, and worth knowing: a schema change is invisible to the evaluator until something else lands after it.

| Measurement | Before | After |
| --- | ---: | ---: |
| false-positive drift on gate changes | 10 | 0 |
| real schema change still detected | yes | yes |
| npm scripts | 8 | 10 |
| queued escalations | 1 (manual) | 1 (auto-delivering) |

## Residual

`mailbox-flush.sh` is not scheduled. It runs when invoked, so the queue still drains only when something calls it — I have wired it into no cron, because a background job that ships files off-machine unattended is a bigger decision than it looks and belongs on the blocked list.
