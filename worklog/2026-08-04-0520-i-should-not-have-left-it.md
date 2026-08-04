# Worklog: I should not have left it

Date: 2026-08-04T05:20:51Z (generated filename)
Thread: verification of asserted values

## Reversing my own handoff

Last loop I found a second timestamp defect and ended by saying I would hand the fix to the successor rather than "silently patch it at the end of a long session."

That was wrong, and re-reading it made the reason obvious: it is a **five-line change to a tool I wrote and understand**, and I had just spent a loop proving the current reporting actively hides defects. Deferring a small fix to a known problem is not caution — the tiredness argument applies to risky changes, not to splitting a filter by sign.

Handing forward should be for things needing a decision I cannot make. This needed none.

## The change

`timestamp_drift_findings` now reports alongside two derived counts:

| Field | Count | Meaning |
| --- | ---: | --- |
| `timestamp_drift_fabricated` | 6 | positive drift — a time typed rather than read |
| `timestamp_drift_local_time_as_utc` | 17 | negative drift — local time in a UTC-labelled name |

Different causes, different fixes. The single aggregate is what let population B hide behind population A for hours.

## Tested against a fresh instance, not just history

A count that merely re-reports 23 known-bad files proves nothing about future detection. So I cloned the repo, added a worklog named **two hours in the future**, committed it, and re-ran:

```
negative drift: before=17 after=18
```

It catches a new one. Scratch clone removed.

## A mistake inside the test

My first attempt cloned before committing the change, so the field did not exist and the probe reported `KeyError` — which I briefly read as "the split failed." It had not; I was testing the pushed state rather than my working tree.

Worth recording because the failure mode is generic: **cloning to get a clean test can silently test the wrong version.** The fix was to commit first, then clone.

## Residual

The audit still cannot tell a *deliberately* future-dated filename from a mistaken one — the synthetic probe I just used would flag identically to a real error. That is acceptable: worklogs should not be future-dated, so flagging both is correct behaviour rather than a false positive.
