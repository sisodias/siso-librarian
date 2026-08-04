# Worklog: closing the silent paths

Date: 2026-08-04 05:20 UTC (from `date -u`)
Thread: Observatory — failure honesty

## What I said I would do, and did

Last loop I named two remaining silent error paths rather than implying they were fixed. Both are now closed, and both were tested by breaking them rather than by reading the code and reasoning.

## `countFiles` returned 0 for a missing directory

This is the one with a proven cost: it is exactly how a hyphen/underscore typo reported **0 source inventories** when six existed, including the Gutenberg corpus registration. A missing directory and a genuinely empty one produced the same output, so no amount of value-checking could tell them apart.

`countFiles` now returns `null` for an absent path and records it in a `missing_sources` list on the snapshot. The card renders **`SOURCE MISSING`**.

Tested by reverting the path to the underscore form:

```
Source inventories    SOURCE MISSING
missing_sources: ['~/SISO_Workspace/great-library-of-siso/registry/source_inventories']
```

Restored: `6`. Had this existed yesterday, the original bug would have announced itself on the page the moment it was introduced.

An intermediate version rendered the literal string `null`, which is technically honest and useless to a viewer — it reads as a bug in the page rather than a fact about the Library. Fixed before committing.

## Routing failures collapsed into one `unknown`

The routing query caught every error identically. A missing log, an unreadable database, and a malformed query all produced `unknown` — which means a query I had broken myself would look exactly like a quiet gateway.

Failures are now classified: `query_invalid`, `log_unreadable`, or `query_failed`, with the message preserved. Tested by pointing the query at a nonexistent table:

```
state: unknown | failure: query_invalid
```

Restored: `observed · 120 req`.

| Silent path | Before | After |
| --- | --- | --- |
| missing count directory | `0` | `SOURCE MISSING` + named path |
| broken routing query | `unknown` | `unknown` + `query_invalid` + message |
| corrupt latest snapshot | previous version, silently | previous + `N UNREADABLE` |

## What this session has actually been about

Not verification, in the end. Every defect has been the page — or a worklog — sounding more certain than its evidence: `verified` from a stale string, `0` from a wrong path, `36` from an unread count, `v35` from a swallowed exception, timestamps from nowhere at all.

The repair each time was the same shape, and it was never "check harder". It was giving the artifact a way to express doubt. A surface that can only render success is decoration, and `catch {}` is where that gets encoded, because it converts a genuine failure into a plausible value — the single most expensive kind of wrong.

## Residual

The three fixed paths are the ones I had evidence for. Others remain: `parseInt(... || '0') || 0` in the snapshot reader turns an unparseable version into 0 rather than flagging it, and `sh()` throws on any non-zero exit without distinguishing a missing binary from a real failure.

And the larger one is unchanged: I have still never opened the 25 works, 75 releases, 28 events, or 4 decisions. Counting them correctly says nothing about whether the labels describe what is inside — which is precisely the assumption that was wrong about snapshots and assemblies, twice, in the two loops before this one.
