# Worklog: which MiniMax numbers survive checking, and which never can

Date: 2026-08-04 04:00 UTC (from `date -u`)
Thread: verification of asserted values

## What I checked

The MiniMax token and cache figures from 2026-08-03 were prose with no stated source — the numbers I would most likely be asked to defend and, until now, could not. They split cleanly in two, and the split is the finding.

## Re-derivable, and re-derived

**The load-bearing claim holds and got stronger.** MiniMax `cached_read_tokens` through Bifrost was asserted as 0 across 45 requests. Re-derived today: still exactly **0**, now across **207 requests and 3,703,946 prompt tokens**. Not a single cached read has ever been recorded on that path.

The contrast claim also holds. CodexOpenAI cached reads were 23,581,696 and are now 44,010,496 — a cumulative counter on a live log, so growth is correct. What matters is the shape: cache accounting demonstrably works on that gateway for another provider, which is what makes MiniMax's zero meaningful rather than an artifact of Bifrost not recording the field at all.

**The runner smoke totals re-derive from the artifact.** 851 prompt tokens, 662 completion, 512 cached — all three summed back out of `metrics/2026-08-03-mm-bulk-runner-smoke.jsonl` and confirmed, because the runner wrote raw per-job usage instead of only a summary. The auditor now performs that sum on every verify; tampering with an asserted total is caught (`asserted 9999, derived 512`).

| Measurement | Before | After |
| --- | ---: | ---: |
| counts independently re-derived | 14 | 14 |
| JSONL sums re-derived | 0 | 3 |
| MiniMax claims with stated derivations | 0 | 3 |

## Not re-derivable, and now labelled so

Two figures cannot be checked, ever, and pretending otherwise would be the same failure I have been chasing all night.

The **cache_control two-call test** — 128 cached tokens on the first call, 2,816 on the second — came from live provider responses. go-llm-proxy does not persist per-request usage, and those calls bypassed Bifrost, so nothing on disk records them. The finding they support is almost certainly right, and the numbers are unverifiable. Both things are true.

The **33.88MB/s transfer rate** in the passage-backup worklog was read off rsync's progress output, which was never captured. Worth being precise: the SHA-256 and byte counts from that loop *were* verified and remain checkable. Only the throughput figure is unbacked.

Both are now recorded in `metrics/2026-08-04-minimax-claims-with-derivations.json` under `not_rederivable`, with why, rather than sitting in prose looking as settled as the numbers that survived checking.

## The distinction worth keeping

Half of tonight's verification work has been discovering that I treat some numbers as findings and others as decoration, and only check the first kind. The useful output is not the checks themselves but the habit of asking, before writing a number down, *what would let someone else re-derive this?*

Where the answer is "nothing", the fix is usually cheap and structural: have the tool that measures write a durable artifact. `mm-bulk-runner.mjs` already does this, which is the only reason three of tonight's figures survived audit while the proxy test's did not.

## Residual

The auditor's JSONL check still hardcodes which totals to verify, exactly like the metric-count check did before the snapshot began declaring its own derivations. The better shape is for metrics files to carry a `derivations` block the way the observatory snapshot now does, so the auditor reads rather than knows. That is the next consolidation, and until it happens each new artifact needs a hand-written entry — which is precisely the kind of manual step that rots.
