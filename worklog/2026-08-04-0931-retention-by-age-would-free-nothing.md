# Worklog: retention by age would free nothing

Date: 2026-08-04T09:31:33Z (generated filename)
Thread: decision 6 — the actual growth driver

## Same move, harder target

Last loop I made 9.5 GB safe to reclaim by vaulting a dead archive. That bought
days but did not touch the driver: the Bifrost log, **3.61 GB/day**.

Same C1-safe procedure, applied to a file a daemon is actively writing.

```
sqlite3 .backup to vault        5.36 GB, safe while the daemon writes
pragma quick_check              ok
rows queryable in the copy      2,261  (live 2,262 — one written during the copy)
```

The one-row gap is not a defect; it is what a consistent point-in-time snapshot
of a live database looks like. Recording it rather than rounding it away.

## Proving before moving

A 3.66 GB archive from 05:35 was already on the vault, stale by four hours. I
did not assume the new snapshot superseded it:

```sql
attach old; select count(*) from o.logs where id not in (select id from main.logs);
-> 0
```

**Zero rows in the old archive are absent from the new one.** 1,674 ⊂ 2,261.
Moved to `superseded/` with the proof written next to it — not deleted, because
proving containment is not the same as proving nobody wants the file.

## The finding that changes the decision

I had been assuming — and had implied to Shaan — that retention would fix this.
Measured:

```
all request bodies           4.88 GB
bodies older than 24 hours   0.02 GB   (187 rows)
```

**A 24-hour retention policy would free 0.4% of the log.** The volume is traffic
from the last few hours, so trimming old rows does essentially nothing while
looking exactly like a solution — the kind of fix that gets deployed, appears to
work, and leaves the disk filling.

The driver is that Bifrost persists a full request body per call. Any real fix
disables body persistence or caps body size. That is a gateway configuration
change and remains Shaan's.

| Measurement | Assumed | Measured |
| --- | ---: | ---: |
| freed by 24h retention | most of it | **0.02 GB (0.4%)** |
| bodies in the log | — | 4.88 GB |
| rows older than 24h | — | 187 of 2,262 |
| old archive rows missing from new | unknown | **0 (proven)** |

Verify exit 0; self-test 11/11.

## What is now true

The live log is preserved on the vault and verified queryable, so truncating it
loses nothing. I have not truncated it — that is a decision, not a chore, and
C1 is absolute. What changed is that the decision is now free of risk and free
of a wrong remedy: the escalation no longer implies retention will help.
