# Worklog: I said a fix exists, then checked

Date: 2026-08-04T09:36:18Z (generated filename)
Thread: decision 6 — from "what do we do" to "flip one flag"

## The sentence that needed checking

Last loop I wrote: *"Any real fix disables body persistence or caps body size,
which is gateway config and yours."*

I asserted a fix existed without confirming Bifrost exposes one. If it did not,
I would have handed Shaan a decision he could not act on.

It does. From `GET /api/config`, confirmed in `config.db`:

```
enable_logging                             true
disable_content_logging                    FALSE   <- the flag
log_retention_days                         365
max_request_body_size_mb                   100
allow_per_request_content_storage_override false
```

One boolean stops the 4.4 GB of `raw_request` and `responses_input_history` that
is the entire growth driver.

## The trade I checked before recommending it

A fix that blinded the cache evidence would be a bad trade — GQ-008 rests on
`cached_read_tokens` from this log. So I did not assume the columns were
independent, I measured:

```
rows with token accounting                    2,280
rows with tokens but EMPTY raw_request          176
```

**176 rows already carry full token accounting with no request body.** That is
demonstration, not inference: content and accounting are separate columns, and
disabling one cannot blind the other.

## An inconsistency I flagged rather than resolved

`config_log_store.config` carries `retention_days: 0`; `config_client` carries
`log_retention_days: 365`. Two different fields with contradictory values. The
client one is what the running gateway reports, but I do not know which the
daemon honours, and guessing would put a wrong claim in front of Shaan.

Recorded as an open question in the metrics file. It does not change the
recommendation — retention is the wrong lever either way, as last loop measured.

| Measurement | Before | After |
| --- | ---: | ---: |
| decision 6 shape | "log grows, what do we do" | **"flip one flag"** |
| fix confirmed to exist | asserted | **measured** |
| evidence lost by the fix | unknown | **none (proven, 176 rows)** |
| config contradictions found | 0 | 1 (flagged) |

Verify exit 0.

## Not applied

Gateway configuration is outside what I decide, and I have not touched it. The
escalation now carries the flag name, its current value, the proof that
measurement survives, and the one inconsistency I could not resolve — which is
everything needed to make the call in one read.
