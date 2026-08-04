# Worklog: two gates disagreeing

Date: 2026-08-04T09:58:03Z (generated filename)
Thread: the twelve skips I called "mostly legitimate"

## Testing a judgement instead of trusting it

I said the remaining twelve silent skips were "mostly legitimate", and added that
this was *"a judgement I made by reading them, not a verification"* with a
demonstrated error rate. So I tested the most dangerous one: an unparseable
**claim** file.

```
verify-claim-packets.mjs   exit 1   <- catches it
audit-asserted-numbers.mjs exit 0   <- reports success
```

The verifier catches a broken claim, so it cannot reach a push. But the audit
**exited 0 and reported success** while silently dropping that claim from its
grounded-evidence set — meaning the claim's evidence stopped being audited and
nothing said so.

Two gates disagreeing about whether the repo is healthy is worse than either
failing alone, because the passing one is the reassuring one.

Fixed: `claim-unparseable`, counted in `checks_skipped`, exit 3 under
`--strict`. Proven both directions, then added as self-test case 12.

So "mostly legitimate" was right about eleven and wrong about the one that
mattered — which is roughly the error rate I predicted for that judgement, and
the reason I tested rather than reasoned.

## A number I checked before worrying about it

The same output showed **`timestamp_drift_findings: 23`** in a passing audit —
6 fabricated, 17 local-time-as-UTC. Both counts are exactly the historical
populations I diagnosed earlier in the session, so the question is whether any
are *new*.

```
latest drifting worklog   2026-08-04-0935-the-link-flapped.md
latest worklog overall    2026-08-04-0953-the-defect-that-lives-outside-the-gates.md
worklogs written after the last drift: 5, all clean
```

**The generated-filename fix has held.** The 23 are a closed historical set, and
they stay advisory rather than gating deliberately: rewriting committed history
to satisfy a checker would destroy the record of what actually happened, which is
the more valuable thing.

Worth stating that I verified this rather than assuming the fix worked — the
counts matching my memory is exactly the kind of agreement that means nothing.

| Measurement | Before | After |
| --- | ---: | ---: |
| silent skips that hid a real gap | 12 unknown | **1 found, fixed** |
| gate self-test cases | 11 | **12** |
| worklogs since the last timestamp drift | — | **5, all clean** |
| new drift | — | 0 |

Verify exit 0; self-test 12/12.

## Eleven still silent

I have now tested two of the twelve and found one real. The remaining eleven are
skips over worklogs without timestamps, non-JSON files in claims/, and files that
do not exist — each genuinely nothing-to-check.

But that is again a judgement by reading. The honest position is that I have
verified two and reasoned about eleven, and the one I verified was the one my
reasoning had cleared.
