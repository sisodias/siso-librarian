# Worklog: a contradiction that does not matter

Date: 2026-08-04T09:42:54Z (generated filename)
Thread: decision 6 — closing the loose end I left

## What I left open

*"config_log_store carries retention_days: 0 while config_client carries
log_retention_days: 365. I did not want to guess which the daemon honours."*

Flagging rather than guessing was right. Leaving it there was not — an open
question in an escalation is work I have handed to Shaan, and this one was
answerable without him.

## The answer

```
log file created   2026-08-01 20:08:31
oldest row         2026-08-01 19:34:55Z   (34 minutes BEFORE the file existed)
newest row         2026-08-04 09:37:33Z
span               2.59 days
```

The oldest row **predates the file it lives in**, so the log was recreated from
a prior store rather than pruned. And in a 2.59-day window neither policy could
have deleted anything: 0 means *disabled*, not "delete everything", and 365 days
have not elapsed.

**No pruning event exists to attribute to either field.** Retention has never
fired on this log. The contradiction is real and currently inert.

Confirmed by the archive: history before 2026-08-01 sits in
`archives/logs-mini-full-through-20260720T125534Z.sql.zst` (1.8 GB), moved by
hand. Someone archived it manually — which is itself evidence that retention was
not doing the job.

## The experiment I declined

The contradiction becomes decidable by setting a short retention and watching
what disappears. On a live gateway, to settle a documentation question, that
trades real log data for a fact nobody needs — retention is the wrong lever
regardless, as I measured two loops ago (0.02 of 4.88 GB is older than 24h).

Recording *why I did not run it* matters as much as the result. "Undecidable
from observation" would be a weaker note without the reason the cheap experiment
was refused.

| Question | Before | After |
| --- | --- | --- |
| which retention field applies | unknown | **neither has ever fired** |
| open questions in the escalation | 1 | **0** |
| pruning events found | unknown | 0 |

Verify exit 0; self-test 11/11.

## Decision 6 as it now stands

One flag, `disable_content_logging`, currently false. Flipping it stops the
4.4 GB driver. Token, cost and latency columns survive — proven by 176 rows that
already carry accounting with no body. The log is on the vault, so truncating
the live copy loses nothing. Retention is a red herring, twice measured.

Nothing about it is ambiguous any more, and none of it is applied.
