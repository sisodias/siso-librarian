# Worklog: turning a comment into a guarantee

Date: 2026-08-04T05:51:46Z (generated filename)
Thread: handover coherence

## Fixing what I flagged last loop

I ended the previous loop noting that `verify` now depends on the observatory being rebuilt first, and that this ordering lived only in a comment — "the weakest form of guarantee in this repo."

Naming a weakness is not fixing it, and this one was cheap to fix.

## The enforcement

The verifier now checks that `observatory/snapshot.json` carries a `generated_at` **less than 300 seconds old**. If it does not, the gate fails with a message that names the remedy:

```
stale by 6646s (limit 300s) — run \`npm run observatory:build\` first;
verify must rebuild it before checking
```

The dependency no longer relies on chain order surviving future edits. Reorder `package.json`, drop the build step, or run the checks standalone, and the gate refuses instead of quietly inspecting stale data.

## Tested by breaking it the way it would actually break

Backdating `generated_at` by 100 minutes and running the checker alone — exactly what a reordered chain produces — exits **1** with that message. The full `npm run verify` then heals it, and `generated_at` returns to the current time.

I chose 300 seconds because a full verify takes seconds, so anything older means the build did not run in this invocation. It is overridable via `SNAPSHOT_MAX_AGE_S` for anyone who needs to run checks against a captured snapshot deliberately.

## Why this shape

The alternative was documenting the constraint harder. Tonight has produced enough evidence about what documentation is worth: I wrote "read the clock" as a lesson and then produced seventeen consecutive wrong filenames.

A guarantee that survives its author forgetting is worth more than an instruction that assumes they will not.

| Measurement | Before | After |
| --- | --- | --- |
| ordering constraint | comment in package.json | enforced, exit 1 |
| stale snapshot passing the gate | possible | impossible |
| failure message | none | names the fix |

## Residual

The bound is time-based, not causal. A snapshot rebuilt by something *other* than this verify run — a cron, a parallel shell — inside the window would satisfy it. That is acceptable: the failure being defended against is *nobody rebuilt it*, not *the wrong process did*.

It also assumes the clock is sane. Tonight established the clock is correct and that my reading of it was the problem, so I am comfortable depending on it here — but a machine with a skewed clock would produce confusing failures from this check.
