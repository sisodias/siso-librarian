# Worklog: my own fix still filled the disk

Date: 2026-08-04T18:23:40Z (generated filename)
Thread: root at 16Gi, my loop causing 91% of the growth

## 13 GB reclaimed, nothing deleted

Two items I had recorded as "quarantined but unreclaimed" for several loops were
still on the internal SSD. Both had the same shape: quarantine had meant
*renamed into a folder on the same disk*, which frees nothing.

Both are now on the vault, and neither was deleted:

| Item | Size | Proof taken BEFORE release |
| --- | ---: | --- |
| `passages_v1.sqlite.gz` | 10,203,671,683 B | md5 `ffca3a1a…` on both sides, re-derived after the move |
| `pi-lens-caches` | 315 files / 3,407,840,644 B | file-count and total-bytes identical both sides |

**Free space: 16Gi → 28Gi.**

The caches nearly went wrong. The vault had a `pi-lens-history/` directory,
which reads like the backup — it holds a single **512K** tarball named
`pi-lens-non-cache`. It is the explicit *complement* of what I was about to
release. I copied 3.2 GB first and verified both sides, and the vault README now
says this directory is the only copy.

## The growth source, measured

`~/.config/bifrost/logs.db`, **9.43 GB in 3,193 rows** — ~2.9 MB per row.

```
raw_request       3,681 MB   <- 41%, a verbatim copy of my own prompt
content_summary     755 MB
params              272 MB
tools               271 MB
raw_response        141 MB
```

| Day | Rows | GB |
| --- | ---: | ---: |
| Aug 1 | 136 | 0.00 |
| Aug 2 | 28 | 0.01 |
| Aug 3 | 759 | 0.66 |
| **Aug 4** | **2,271** | **4.35** |

2,271 of 3,193 rows are today. Every cron tick sends my whole accumulated
context and the gateway stores it verbatim.

## Two wrong turns, both of which I would have reported as fixes

**I wrote the setting into the database and it changed nothing.** `config.db`
said 7; the running gateway kept answering **365**. The config is read at
startup and `/api/config` is the authority. I only caught it because I re-read
from the process instead of trusting my own UPDATE — the same shape as C4, where
an exit code is not an outcome.

**Then I set 7 days and nearly stopped.** Sizing the steady state killed it:
7 × 4.35 GB/day = **30.4 GB against 28 GB free**. My own fix still filled the
disk. Now **3 days**, converging to ~13 GB, and all three places agree — live
process, `config_client`, log-store config.

I also found the log store's own `retention_days` was **0**: no expiry at all.

## What I did NOT claim

**This reclaims nothing today.** The corpus spans 2.95 days, so a 3-day window
evicts almost nothing yet. It bounds future growth; it does not shrink the
9.43 GB now on disk. "Freed 9 GB" would be false.

## An open question that was never open

I recorded `disable_content_logging` as blocked on an "unknown gateway-side
override header contract" for several loops. It is not unknown:
`allow_per_request_content_storage_override = 0` and
`allow_per_request_raw_override = 0`. The gateway forbids per-request overrides
outright — the header I wrote and tested could never have worked. Thirty seconds
of reading `config_client` would have closed it at any point.

Config backed up to the vault before any change (`.backup`, `quick_check(1)`
ok). `disable_content_logging` left at 0 deliberately: that is observability
policy, Shaan's call, and retention now bounds the cost either way.

Verify exit 0.
