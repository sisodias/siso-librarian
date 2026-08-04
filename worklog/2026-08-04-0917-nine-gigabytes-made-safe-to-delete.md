# Worklog: nine gigabytes made safe to delete

Date: 2026-08-04T09:17:50Z (generated filename)
Thread: decision 6 — doing the part that is mine

## The reasoning

~5 days of headroom, and C1 forbids deleting. But C5 says bulk sequential
artifacts belong on the vault, and **moving is not deleting**. The part of
decision 6 that is mine is making the space *safe* to reclaim; the reclaiming
itself stays Shaan's.

`passages_v1.sqlite.gz` — **10.2 GB**, the v1 archive, while v2
(`~/passages.sqlite`, 23 GB) is the live index. My own settlement proposal from
2026-08-03 already specified the procedure: *"copy to vault, checksum, then
consider local quarantine/rename after consumers checked."* I had written the
plan and never executed it.

## Executed, in order

```
no open file handles                                  (lsof, clean)
no references in SISO_Workspace / .config / LaunchAgents
gzip header reads, contains "SQLite format 3"
rsync to vault                                        10,203,671,683 bytes
sha256 local  cef7fe1d...f63e1c
sha256 vault  cef7fe1d...f63e1c                       MATCH
mv to ~/quarantine-2026-08-04/                        rename, not removal
README-BEFORE-DELETING.txt written                    one-line mv restores it
```

## The number that did not move

**Root free space: 19Gi before, 19Gi after.**

A rename within one filesystem frees nothing. I am recording that plainly
because reporting this as a disk win would be false — and the temptation was
real, since "moved 10 GB off root" reads like a fix.

What actually changed: 9.5 GB is now **safely reclaimable** — verified byte-for-
byte on the vault, provably unreferenced — instead of a large file nobody dared
touch. Deleting it buys ~2.5 days at the measured burn rate.

## Two things I got wrong first

`mkdir` at the vault root returned **permission denied**, and I nearly concluded
the vault was read-only. It is not — it is `drwxrwxr-x shaansisodia staff`. I
looked instead of forcing it, and found `librarian-vault/` already holding
`passage-index` and `bifrost-logs` from earlier work. Using the existing
structure was right; inventing `/library-archive` at the root was not.

`rsync --no-compress` is not a flag on macOS rsync. Read the error rather than
retrying with sudo.

| Measurement | Before | After |
| --- | ---: | ---: |
| root free | 19Gi | 19Gi (unchanged, honestly) |
| safely reclaimable | 0 | **9.5 GB** |
| copies of the v1 archive | 1 (local only) | 2 (vault + quarantine) |
| sha256 verified | no | yes, both sides |

Verify exit 0.

## Still Shaan's

The delete is his, and so is decision 6 proper — the Bifrost log is the actual
growth driver at 3.61 GB/day, and quarantining an old archive does not touch
that. This buys days, not a solution. The escalation now carries both the
corrected growth figure and the one-line command that reclaims the 9.5 GB.
