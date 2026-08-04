# Worklog: the first deferral that held

Date: 2026-08-04T17:17:28Z (generated filename)
Thread: decision 4

## Tested, and it survives

```
loopback   127.0.0.1:8765      200
tailnet    100.66.34.21:8765   200
cloudflared                    running, --token tunnel, pid 8611
local ingress config           NONE
```

A `--token` tunnel reads its routes **from the dashboard**. There is no
`~/.cloudflared/*.yml` and no `/etc/cloudflared/*.yml` that could define one
locally, so the remaining step needs credentials I do not have and should not
have.

**Machine side is genuinely finished.** The claim was accurate.

## Eleven tested, one intact

```
C6 "do not touch"            "without copying first"
plist "malformed XML"        plutil says OK
"both one plist edit"        one is
"needs hardware"             narrower
"blocked on a person"        1 trigger of 5
"outside this repo"          four exports, on this machine
"every agent on the box"     3.7% of traffic
"an unavoidable trade"       two override flags unread
"a copyright determination"  true, but 270,049 need none
"SEC-F16 from June"          zero commits; July prompt-injection audit
"where should refs go"       fallback verified, question narrowed
"Cloudflare ingress"         HOLDS
```

Twelve now, and **decision 4 is the only one accurate at exactly the scope
stated**. Nothing to narrow, nothing I could have done and did not.

That matters as a calibration point. If every deferral had dissolved, the honest
reading would be that I defer reflexively and none of it is real. One holding —
and holding cleanly, with a credential boundary I genuinely cannot cross —
means the category exists and I was over-populating it.

## A detail I noticed and am not acting on

The tunnel token is fully visible in `ps` output. That is how cloudflared is
normally invoked and not a defect I introduced, but anything that can read the
process table on this machine can read the tunnel credential.

Recorded because I saw it. Not escalated as urgent, not fixed — rotating a
tunnel token is Shaan's, and the exposure is the default behaviour of the tool.

| Measurement | Value |
| --- | ---: |
| deferrals tested | **12** |
| survived intact | **1** |
| decision 4 status | verified, still blocked |
| endpoints serving | 2 of 2, both 200 |

Verify exit 0.
