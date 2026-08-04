# Worklog: I made the gate chain unusable

Date: 2026-08-04T11:01:10Z (generated filename)
Thread: verifying the vaulted passage index

## Two corrections to myself

**My root cause was wrong.** I wrote that `mode=ro` fails on the vault because
the external volume refuses WAL/shm sidecars. Too broad — the vaulted passage
index opens fine either way. The real discriminator is in the file header:

```
passages.sqlite     write_version 1 (rollback journal)  -> mode=ro works
logs-<stamp>.db     write_version 2 (WAL)               -> mode=ro fails
```

Found by reading bytes 18-19 of both headers instead of theorising about the
filesystem. A WAL database still wants a `-shm` file on a read-only open;
`immutable=1` tells SQLite the file cannot change so none is needed.

**Then I broke the gates.** Having made vault databases verifiable, I declared a
derivation for the vaulted index's row count. `npm run verify` stopped
returning; the self-test hung with zero output.

```
sqlite3 ... passages.sqlite "select count(*) from passage"   2m09s and counting
```

41.5M rows over USB. The audit runs on every verify and **a dozen times inside
the self-test**, so one declaration turned a 58-second chain into something that
never finished.

Removed it. Measured once, timing recorded, not re-run per invocation.

> A gate slow enough to skip is a gate that gets skipped.

```
verify      58s   exit 0
self-test   2m46  12 passed, 0 failed
```

## What the backup check actually proved

```
passage rows     live 41,501,325   vault 41,501,325   MATCH
book_body rows   live 77,540       vault 77,540       MATCH
rowid 1          MATCH   "The Magna Carta Contents..."
rowid 1,000,000  MATCH   "R626880. Improved blue ribbon..."
rowid 41,501,325 MATCH   "I am loathe to close. We are not enemies"
```

First, middle and last. What I did **not** do is a full-table checksum — a
`sum(chars),sum(words)` scan timed out at ten minutes. Three spot checks are
weaker than a checksum and I am recording them as three spot checks, not
rounding up to "verified identical".

| Measurement | Value |
| --- | ---: |
| vault index rows matching live | 41,501,325 |
| content spot checks passing | 3 of 3 |
| verify chain runtime | 58s (was: never finished) |
| root-cause explanations corrected | 1 |

Verify exit 0; self-test 12/12.

## The pattern worth keeping

Every gate I add has a cost, and this is the first time the cost was
disqualifying rather than annoying. The fix was not a better query — it was
recognising that some measurements belong in a metrics file taken once, not in a
chain that runs on every push.
