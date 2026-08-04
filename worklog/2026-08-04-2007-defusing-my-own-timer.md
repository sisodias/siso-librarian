# Worklog: defusing the timer I set myself

Date: 2026-08-04T20:07:44Z (generated filename)
Thread: 6 derivations reading a database I set to expire

## The trap, restated

I set `log_retention_days` from 365 to 3 to stop the log filling the disk.
Only afterwards did I find **six declared derivations reading that database**.
They re-derived because the oldest rows had not aged out yet — and the audit
runs them on every push, so this was a gate failure on a countdown of my own
making.

Last turn I made it visible as a warning. Visible is not fixed.

## What the derivations actually need

Reading the queries rather than assuming: five aggregate over token columns, and
four are already **time-bounded** (`timestamp <= '2026-08-04 04:19:50'`). A
bounded query over a fixed set of rows has a fixed answer. Those rows are all
that is required — not the log.

So: a column slice on the vault.

| | |
| --- | ---: |
| kept | token + provider columns, 3,353 rows |
| **not** kept | `raw_request` (3,681 MB), `content_summary`, every prompt body |
| slice | **643 KB** |
| source | **9.43 GB** |

**0.007% of the bytes preserves 100% of the numbers.** The point was never to
hoard prompts; it was to keep the arithmetic re-derivable.

## Verified before switching, not after

```
45285517  109467  408  85.86  0     -> 5/5 byte-identical, live vs slice
```

And the test that actually matters — querying the slice alone, as if the live
log were already evicted, returns **45285517**. The numbers no longer depend on
a database that deletes itself.

One derivation deliberately still points at the live log: `free_pages` reads a
**pragma about the file**, not its rows. Against an archive it would be
meaningless. So one warning remains, and it is correct.

## My own check was wrong, for the third time today

After repointing all five, the warning count **stayed at 6**. The check
stringified the whole derivation object — so the `source_note` I had just
written explaining the repoint, which necessarily names the old path, kept the
warning alive.

Today that makes three: a comment satisfied the coverage gate; a comment in
`gate-selftest.sh` triggered a false positive; and now a note kept a resolved
warning alive. **The field is the fact. The note is commentary.** Fixed by
matching `d.source`.

| | Before | After |
| --- | ---: | ---: |
| warnings | 6 | **1** |
| findings | 0 | **0** |
| derivations re-derived | 31 | **31** |

Verify exit 0. Gate self-test: 14 passed, 0 failed.
