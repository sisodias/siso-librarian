# Worklog: the tool nobody could find

Date: 2026-08-04T05:48:25Z (generated filename)
Thread: handover coherence

## Auditing the repo instead of adding to it

Nine hours of loops have produced a lot of small tooling. Before building more I checked whether the thing a successor inherits actually coheres — every script, and whether it is reachable from `package.json` or mentioned in any doc.

Four were reachable from neither:

| Script | In package.json | In docs |
| --- | --- | --- |
| `build-observatory.mjs` | **no** | **no** |
| `serve-observatory.mjs` | **no** | **no** |
| `probe-ia-metadata.mjs` | **no** | **no** |
| `mm-bulk-runner.mjs` | **no** | **no** |

The first one matters most. **`build-observatory.mjs` generates the snapshot and the page that everything else reads** — the observatory Shaan asked for — and a successor reading `package.json` would never learn it exists.

I have been running it by hand every loop. That worked because I remembered. It is exactly the manual step that rots, which I have now criticised twice tonight in other people's designs and shipped in my own.

## The fix, and the better fix

All four are registered as npm scripts, and the README gained a **Running it** section, since `package.json` is not where someone looks first.

The stronger change: **`npm run verify` now rebuilds the observatory before running the checks.** A stale page can no longer survive a passing gate — the two are welded together rather than related by my memory.

Tested by falsifying the snapshot: set `topic_edges` to `111111`, ran verify, and it came back **2,555,047**. The gate heals the artifact rather than merely inspecting it.

## Why welding beats documenting

I could have written "remember to rebuild the observatory" in the handover. That is the same class of instruction as "remember to check the clock", which I violated for seventeen consecutive filenames tonight.

Documentation tells a successor what to do. Wiring it into the gate means they cannot forget — and the whole point of the gate is that it catches the author, not just the reader.

| Measurement | Before | After |
| --- | ---: | ---: |
| npm scripts | 4 | 8 |
| scripts unreachable from pkg or docs | 4 | 0 |
| observatory rebuilt by | memory | `npm run verify` |
| verify steps | 4 | 5 |

## Residual

Ordering now matters: the observatory build runs first so downstream checks see current counts. If someone reorders the chain to put a check before the build, the gate silently returns to inspecting stale data. That constraint is a comment in `package.json`, not an enforced invariant, and a comment is the weakest form of guarantee in this repo.
