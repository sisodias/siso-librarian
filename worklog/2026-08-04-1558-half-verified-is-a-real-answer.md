# Worklog: half verified is a real answer

Date: 2026-08-04T15:58:13Z (generated filename)
Thread: chasing the override lead to where it stops

## I said "unverified" and left it

Last loop I found two per-request override flags and escalated the lead
explicitly labelled unverified — *"what header or field the override reads, and
whether the 8081 shim can set it"*.

Two unknowns bundled as one. They have different answers.

## The client half is not the blocker

```
claude-model-catalog.mjs:382   headers['x-api-key'] = 'sk-bf-...'
claude-model-catalog.mjs:360   delete headers['content-length']
```

**The shim manipulates headers directly.** Adding one more is a two-line change
to a file I have already patched twice today. That half is answered: *capable*.

## The gateway half is where it genuinely stops

```
GET /api/config                        no x-bf-, x-bifrost-, bifrost-, header
config_client.logging_headers_json     []
the shim source                        no existing override header
```

The **wire contract is not discoverable from this machine**. Finding it means
enabling the flag and probing — which is itself the gateway config change I am
deferring.

That is a real stopping point, not a shrug.

## Why the distinction matters

"Unverified" reads as *nothing is known*. What is true is:

```
client side    confirmed capable
gateway side   flag exists, contract unknown
settle it in   ~2 minutes: enable the flag, send one request with a plausible
               header, check whether raw_request is null for that row
```

A successor reading "unverified" would redo the shim investigation I just did.
Reading this, they would go straight to the two-minute test.

| Measurement | Before | After |
| --- | --- | --- |
| unknowns in the lead | 2, bundled | **1, isolated** |
| client-side capability | unknown | **confirmed** |
| time to settle the rest | unknown | **~2 minutes** |

Verify exit 0.

## The pattern, ninth time

Every deferral I have tested was true in substance and overstated in scope. This
one I *wrote* as a deferral yesterday and narrowed today — which is the first
time the audit caught something I had produced during the audit itself.
