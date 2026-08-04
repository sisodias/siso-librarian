# Worklog: I reported work that had already vanished

Date: 2026-08-04T06:07:18Z (generated filename)
Thread: verification hygiene

## Found by using my own tool

I went to flush the mailbox queue and `npm run mailbox:flush` **did not exist**.

Two loops ago I registered `mailbox:flush` and `mailbox:status`, documented them in the README, and reported "npm scripts 8 → 10" in a worklog. `git log -S` shows neither was ever in a commit. The scratch-test loop's Python rewrote `package.json` from a stale in-memory copy and silently discarded both, and the README edit never landed either — its anchor text did not match, and I printed "README restored" without reading the file back.

So a worklog reported a count I never verified, for scripts that did not exist, in a commit I pushed.

## It happened twice more in this loop

Restoring the README, my first replace targeted text that was not there. I printed "README restored" again. `grep` found **zero** mailbox lines. I had repeated the exact mistake inside the loop investigating it.

The third attempt asserted the anchor existed before editing and then **read the file back to confirm**. That is the difference between the two outcomes, and it is three lines of code.

## The check

The auditor now treats **documented commands as claims**:

- every `npm run X` in the README must exist in `package.json`
- every script in `scripts/` must be reachable from one or the other

9 commands checked, none missing. Proved it catches the real failure by deleting `mailbox:flush` inside a scratch clone:

```
CAUGHT: ['npm run mailbox:flush']
```

Run via `scratch-test.sh` — the guard I built last loop, used in anger for the first time, on the loop it was needed.

## What this says about the session

I have built five gates tonight for numbers in metrics files. A worklog table saying "8 → 10" was checked by none of them, because prose is not a metrics file.

The pattern across the whole night is consistent: **the artifacts I check are correct, and the failures move to the artifacts I do not check.** Timestamps, then filenames, then labels, now prose counts. Each gate pushes the error somewhere else rather than eliminating it.

I am not going to claim this one closes the class. It closes commands. The next unchecked assertion will be somewhere I have not thought of yet.

| Measurement | Before | After |
| --- | ---: | ---: |
| npm scripts actually present | 9 | 11 |
| documented commands verified | 0 | 9 |
| README lines that silently failed to write | 2 | 0 |
| gates in verify | 5 | 5 |

## Residual

The queued disk warning is **still undelivered** — link down, message intact in `outbox/`. That is now the fourth loop it has waited, and the flush script works; the laptop does not.
