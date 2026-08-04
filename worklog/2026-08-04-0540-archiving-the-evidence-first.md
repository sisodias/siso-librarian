# Worklog: archiving the evidence first

Date: 2026-08-04T05:40:02Z (generated filename)
Thread: machine health — decision 6

## Doing the reversible half

Last loop I measured Bifrost's log growing ~1GB/day and declined to prune it, because it is the evidence base for the GQ-008 and GQ-002 claims. I also said that if space got tight I would archive to the vault first and delete second.

Archiving costs nothing, risks nothing, and removes the objection that makes deletion dangerous. So I did that half now rather than waiting for pressure.

**`/Volumes/SISO-STORAGE-VAULT/SISO-VAULT/librarian-vault/bifrost-logs/logs-20260804T053544Z.db`** — 3.4GB, vault has 3.8Ti free.

## Why `.backup` and not `cp`

The database is in **WAL mode**. A plain `cp` of a live WAL database can capture a torn state — pages from mid-transaction, with the committing writes sitting in a `-wal` file the copy does not include. It would look like a 3.4GB backup and be unrestorable.

`sqlite3 .backup` takes a consistent snapshot while Bifrost keeps writing.

## The scare, and what it actually was

Verification failed hard:

```
Error: in prepare, unable to open database file (14)
```

Exit code clean, 3.4GB written, and the archive would not open — the precise failure the charter warns about, so I treated it as real and diagnosed rather than retried.

The file was fine. `file` reported a valid SQLite 3 database with 894,734 pages, and the header bytes read correctly. **SQLite could not open it because it wanted to create `-wal` and `-shm` sidecars next to the archive** and my read-only handle would not let it. Opening with `immutable=1` worked immediately.

Verified properly:

| Check | Result |
| --- | --- |
| rows, source vs archive | 1,674 vs **1,674** |
| `CodexOpenAI` cached reads | **44,010,496** — matches the GQ-002 claim |
| `Minimax` cached reads | **0** — matches the GQ-008 claim |

Both claim-bearing aggregates reproduce from the archive. The evidence survives independently of the live log.

## A gap in my own auditor

Adding the archive's size as a declared derivation did not raise the count — still 10. The auditor enumerates metrics with `git ls-files`, so **untracked files are invisible to it**. Staging the file took it to 11 derivations across 30 sources.

That is a real hole: a brand-new metrics file's numbers go unchecked until someone commits it. Benign here because I commit every loop, and worth knowing because "the audit passed" means less for uncommitted work.

## What this does not do

It reclaims **zero bytes**. Root disk is still 21Gi, growth continues, and the archive adds to the vault rather than the SSD.

Decision 6 is unchanged and still yours. What changed is that the expensive objection to it — "deleting rows destroys published provenance" — no longer applies, because the provenance now exists in two places and I have proven the second one answers the same questions.
