# Worklog: measuring where the unchecked claims are

Date: 2026-08-04T06:14:05Z (generated filename)
Thread: verification hygiene

## Instead of guessing where the next hole is

Last loop I said "the next unchecked assertion will be somewhere I haven't thought of." Rather than wait to be surprised again, I counted: **128 numeric cells across 37 worklog tables**, checked by nothing.

Most of those are historical before/after snapshots and *should not* be re-derived — "topic edges 2,517,910 → 2,555,047" is a record of a moment, not a claim about now. The dangerous subset is numbers describing **current repo state**, which is exactly what "npm scripts 8 → 10" was when it was silently wrong for two loops.

## The fix was not a sixth gate

I nearly built one. The better move was making those facts machine-readable where an existing gate already looks: the snapshot now emits `repo_health` — npm scripts, verify steps, scripts on disk, metrics files, worklogs, proposals — with four of them declared as derivations.

```
repo_health: {"npm_scripts": 11, "verify_steps": 5, "scripts_on_disk": 11,
              "metrics_files": 31, "worklogs": 62, "proposals": 17}
```

## Two bugs found by testing it, not by reading it

**The audit silently skipped them.** Adding the derivations changed the re-derived count not at all — still 18. The snapshot loop resolved labels as `snap.bucket_counts[group][key]`, hardcoded, so anything outside `bucket_counts` became `undefined` and was **skipped without comment**. A declared derivation that audits nothing and reports success is worse than no derivation. Generalised to fall back to the snapshot root: **18 → 22**.

**Two derivation functions had drifted.** With that fixed, falsifying `npm_scripts` to 999 was caught — but reported `derived: 'unavailable'`. I had added the `json-scripts-count` handler to `deriveValue` and not to `deriveCount`, which serves the snapshot path. The gate fired with a useless message.

Now: `CAUGHT: [('repo_health.npm_scripts', 999, 11)]` — both values named.

Neither bug was visible by reading the code. Both took running it against a falsified input in a scratch clone.

| Measurement | Before | After |
| --- | ---: | ---: |
| counts re-derived per verify | 18 | **22** |
| repo-state facts machine-readable | 0 | 6 |
| snapshot paths auditable | `bucket_counts.*` only | any root key |

## The honest read

This does not close the class. It moves six specific numbers from prose into a checked artifact, and the remaining ~120 worklog numbers are still unverified — correctly so for the historical ones, and I have no mechanism distinguishing those from live claims other than judgement.

What I can say: the specific failure that bit me twice — a current-state count typed into a table and wrong — now has one place to live where it gets checked.

## Residual

`deriveCount` and `deriveValue` remain two functions doing overlapping work, and they drifted once already. I have added a comment tying them together, which is the weak form. Merging them is the right fix and I have not done it, because it touches every derivation path in the audit and this is not the loop to refactor the thing I am relying on to catch my mistakes.
