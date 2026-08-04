# Worklog: silence is not health

Date: 2026-08-04 05:05 UTC (from `date -u`)
Thread: Observatory — reading what I count

## Two things I flagged and then actually did

Last loop I ended by naming two loose ends rather than burying them. Both turned out to be real.

## Assemblies: the same shape as snapshots

`assemblies: 2` was a count of files I had never opened. Opening them: `siso-agent-stack-v1.json` and `siso-agent-stack-v2.json` — both `record_type: assembly`, both named **"SISO Agent Stack"**, versions 1.0.0 and 2.0.0, with 4 and 10 components respectively.

Two versions of one assembly. Exactly the snapshots mistake, one directory over: presenting a version series as a count of distinct records. Relabelled to `assembly_versions`, which is what it measures.

## The silent fallback was real, and worse than I guessed

I suspected the snapshot reader's `catch` might mask a corrupt latest file. I tested it rather than reasoning about it: replaced `whole-library-v36.json` with invalid JSON and rebuilt.

The page displayed **`v35 · 25 rel`**. Confidently. No warning, no asterisk, nothing to distinguish it from a healthy build.

That is the worst failure mode this page can have. The observatory exists so someone can see Library state at a glance; a corrupt current snapshot silently rendering the *previous* version means the page reports stale state as current, and the viewer has no way to know. The `catch` was written to keep the page building — a reasonable instinct that produced an unreasonable outcome.

Unreadable files are now collected and surfaced. Same corruption test:

```
v35 · 25 rel · 1 UNREADABLE
```

Restored, it returns to `v36 · 25 rel` with an empty unreadable list. The snapshot JSON carries the filenames so a reader can find them.

| Measurement | Before | After |
| --- | --- | --- |
| assemblies presented as | `assemblies: 2` (a bucket) | `assembly_versions: 2` (history depth) |
| assemblies read | never | both, v1 and v2 of one stack |
| corrupt latest snapshot | silently shows previous version | shows previous + `N UNREADABLE` |
| counts re-derived | 18 | 18 |
| sources existence-checked | 28 | 28 |

## The principle underneath

Every defect in this thread has been the page sounding more certain than the evidence justified. `verified` from a stale string. `0` from a wrong path. `36` from an unread count. And now `v35` from a swallowed exception.

The common repair is not more checking — it is letting the page say *I don't know* or *something is broken here*. A status surface that can only render success is decoration. `catch {}` is where that gets encoded, because it converts a real failure into a plausible-looking value, which is the exact class of error I have spent this session chasing.

## Residual

The unreadable list only covers the snapshots reader. Other places still swallow errors quietly: `countFiles` returns 0 when `find` fails for any reason, and the routing query returns `unknown` on a thrown error without distinguishing "log missing" from "query malformed". Those are the same pattern and I have not fixed them.

I also still have not read the 25 works, 75 releases, 28 events, or 4 decisions. They are counts of files whose contents I have never opened — the identical mistake, at larger scale. Being right about a count says nothing about whether the label describes what is inside.
