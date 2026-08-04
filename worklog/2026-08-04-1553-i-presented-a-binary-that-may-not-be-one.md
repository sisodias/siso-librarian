# Worklog: I presented a binary that may not be one

Date: 2026-08-04T15:53:58Z (generated filename)
Thread: the eighth deferral

## How I framed it

> *"An observability trade only Shaan can weigh: keep storing bodies and lose
> ~2.92 MB per request, or disable content logging **gateway-wide** and lose the
> ability to inspect any request body — including for debugging the traffic
> filling the disk."*

Clean, honest-sounding, and a binary I never checked.

## What is in the same config table

```
disable_content_logging                     false
allow_per_request_content_storage_override  false   <-
allow_per_request_raw_override              false   <-
```

**Per-request override flags.** Both real columns in `config_client`, both off.

If enabled, a client can opt out of body storage on its **own** calls. Shaan
keeps full inspection for every other client; the 91% of disk growth that is
mine stops being written.

I read `disable_content_logging` off that same query result **three loops ago**
and did not look at the two lines under it.

## What I am not claiming

I have **not** verified the client-side half: what header or field the override
reads, and whether the 8081 shim can set it. The flags exist. The mechanism is
untested.

So this goes to Shaan as a **lead**, explicitly labelled as one — not as "there
is a third option that works". Recording an unverified mechanism as a solution
would be the exact provenance defect I found in GQ-004 this morning.

| Measurement | Before | After |
| --- | --- | --- |
| options presented | 2 | **3 (one unverified)** |
| config flags examined | 1 of 3 | **3 of 3** |
| deferrals tested | 7 | **8** |

Verify exit 0.

## Eight for eight

```
C6 "do not touch"          -> "without copying first"
plist "malformed XML"      -> plutil says OK
"both one plist edit"      -> one is
"needs hardware"           -> narrower
"blocked on a person"      -> 1 trigger of 5
"outside this repo"        -> four exports, on this machine
"every agent on the box"   -> 3.7% of traffic
"an unavoidable trade"     -> two override flags I had not read
```

Still nothing survived. And the failures are getting more specific: this one was
not a wrong constraint or a wrong scope — it was **two lines of output I had
already fetched and stopped reading.**
