# Worklog: the last suite that was off the hook

Date: 2026-08-05T18:01:29Z (generated filename)
Thread: 289s, carried for many turns

## Re-measured first

`gates-are-load-bearing` had been carried as **"289s, too slow for the hook"**
since I first timed it. Re-measured: **402s**. It had gone *up*, because the
chain grew from 8 gates to 11 and this suite replays the chain once per gate.

## Where the cost is

```
build-observatory        25,618ms
audit-asserted-numbers   24,164ms
audit-decisions           7,436ms
corpus-integrity          4,221ms
the other six combined      <400ms
```

**Two gates are 83% of the chain.** Six cost less than half a second between
them.

## A probe of mine that measured the wrong thing

I timed removals with `npm run verify` and got **0–1s**, and briefly concluded
removals were free. Wrong: `npm run verify` includes `audit-verify-chain`,
which catches a missing gate immediately — but the **suite excludes it** from the
chain it replays.

Corrected: baseline **59s**, last gate removed **47s**, first gate removed
**0s**. The chain short-circuits at whatever is removed, so cost depends on
position.

## The fix

Moved the three cheap **snapshot-independent** gates to the front —
`audit-source-coverage`, `audit-reachability`, `build-review-packet`.

The constraint that survives: **`build-observatory` must precede
`audit-asserted-numbers`**, which re-derives the snapshot it writes. That is a
real dependency, not a preference.

| | before | after |
| --- | ---: | ---: |
| `npm run verify` | 418s | **63s** |
| a broken reachability rule | ~50s | **0s** |
| load-bearing suite | 402s | **303s** |

## Result

**All five suites now gate every push**, 417s total. The one I have been calling
"off the hook" for a dozen turns is on it, and 9 of 9 gates verify as
load-bearing.
