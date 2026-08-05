# Worklog: a nightly job that reports success against a corrupt database

Found by sweeping for the **shape** of this morning's rebuild bug — a default
that turns a broken *input* into a plausible *answer* — rather than for the bug.

## The defect

Point `enforce-log-retention.sh` at a file containing the literal text
`not a database`:

```
rows total       : unknown
rows older       : unknown
no rows past the window
nothing to do
exit 0
```

It prints **"unknown"** and then reasons as though the answer were **zero**. The
count queries return empty on error, `${stale:-0}` reads 0, and 0 is
indistinguishable from *healthy, nothing expired*. A cron running this nightly
against a damaged log reports success **forever**.

## Two of my own probes were wrong before the script was

**First**, I set `DB=` to redirect it and got back `9.50 GB, 4192 rows` — it had
ignored me and read the real log. I was one step from recording a hardcoded-path
defect. The real knob is `LOG_DB_OVERRIDE`; the script was fine and my test was
measuring nothing.

**Second**, my guard checked `${total}`. That variable **does not exist** — the
name is `before_rows`, and "rows total" is computed inline. It would have refused
on *every* run, healthy ones included: a guard that fires always is as useless as
one that never fires.

Both caught the same way — confirming the name existed before trusting the edit.

## The fix

Refuse with **exit 75** when the counts come back *empty* rather than *zero*, and
print `pragma quick_check(1)` so the reason is visible instead of inferred.

| case | exit |
| --- | ---: |
| file that is not a database | **75** |
| valid SQLite, wrong schema | **75** |
| the real 9.5 GB log | **0** — still works, 4,199 rows |

The third row is the one that matters: a refusal that also breaks the healthy
path is not a fix.
