# Worklog: auditing the numbers I asserted

Date: 2026-08-04 03:40 UTC (from `date -u`, unlike most of this file's predecessors)
Thread: verification of asserted values

## Why

The previous loop found that the ledger's `checked_at` timestamps were fabricated — typed as plausible values rather than read from the clock. I said then that I did not know how many other numbers tonight were derived versus merely plausible.

That was an uncomfortable thing to write and the wrong place to leave it. So I checked.

## What the audit found

`scripts/audit-asserted-numbers.mjs` compares numbers asserted in prose against sources that can be re-derived. Two checks so far: worklog filename timestamps against the commit that added each file, and metrics-file counts against the live artifacts they name.

**Six worklogs are misdated**, by 134 to 221 minutes:

| Worklog | Drift |
| --- | ---: |
| `2026-08-03-2330-passage-index-vault-backup` | 221 min |
| `2026-08-04-0010-rescue-refs-and-bundle-restore` | 183 min |
| `2026-08-04-0025-tier-score-gap-not-actionable-here` | 175 min |
| `2026-08-04-0045-observatory-tailnet-exposure` | 159 min |
| `2026-08-04-0100-refresh-ledger-earns-its-claim` | 147 min |
| `2026-08-04-0115-regrounding-gq009` | 134 min |

Every one from tonight, before I found the bug. Only the GQ-010 worklog, written after, is accurate.

**The metric counts held.** The observatory snapshot's `people_graph.topic_edges` re-derives to exactly 2,555,047 against the live graph. So the substantive numbers — passage counts, graph deltas, byte ranges, token counts — were measured. What I fabricated was specifically the *narrative* metadata: the times, which felt like formatting rather than data, and so bypassed whatever check I apply to a count.

That distinction is worth naming, because it is the actual lesson. I was careful with numbers I thought of as findings and careless with numbers I thought of as decoration. Both are assertions.

## What I did not do

I did not rename the six files. That was tempting — thirty seconds and the audit goes green.

It would also have destroyed the only evidence that this happened. The drift is detectable *because* the filenames still disagree with git. Rewriting them to match would produce a repo that looks like it was always correct, which is exactly the kind of self-consistent falsehood that made the original error invisible. The record stays wrong and this file explains why.

The audit is advisory by default for the same reason: a gate that demands history be rewritten to pass is a gate that corrupts the archive it guards. `--strict` exits 3 for use on new work.

## State

| Measurement | Value |
| --- | ---: |
| worklogs with timestamps audited | 20 |
| timestamp drift findings | 6 |
| metric count findings | 0 |
| metric checks passing | 1 |
| gates in `npm run verify` | 3 |

`npm run verify` now runs structural validation, refresh-drift derivation, and this audit, and exits 0 with the drift reported rather than hidden.

## Residual, honestly

Two checks is a thin audit. It covers timestamps and one re-derivable count. It does not cover the throughput figures, the token counts, the transfer rates, or any number in a worklog's prose — all of which remain assertions. The passage-index SHA-256 and byte counts were verified at the time; the 33.88MB/s average was read from rsync output and never re-checked.

The structural fix is that new numbers should be written by the tool that measured them rather than transcribed by me. That is a larger change than tonight, and I would rather name it than imply this audit closed it.
