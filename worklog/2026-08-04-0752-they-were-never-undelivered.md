# Worklog: they were never undelivered

Date: 2026-08-04T07:52:45Z (generated filename)
Thread: escalation channel — correcting my own reporting

## What I have been saying

Every loop for hours: *"escalation delivery still at zero with the laptop peer
offline"*, *"delivery count is still zero and I can't change that"*. I treated it
as a hard blocker and reported it as one.

It was wrong.

## Both messages have been readable the whole time

```
outbox/2026-08-04T0553-librarian-disk-growth.md   on remote: YES
outbox/2026-08-04T0640-librarian-ia-rights.md     on remote: YES
```

Remote HEAD matches local exactly (`bcddfabe`). Every escalation is a tracked
file that gets pushed to `sisodias/siso-librarian` with everything else, so both
have been sitting on GitHub since the moment they were written — **including the
corrected IA figure** I worried had gone out wrong.

My charter names three routes to Shaan: mailbox, herdr, worklog. I built
monitoring for exactly one of them, then reported that one channel's state as if
it were the whole picture.

**A channel being down is not the same as a message being undelivered.**
Conflating them let me report "delivered: 0" while two messages were live on a
public remote.

## What was actually broken

Nothing, in the transport. The launchd drain has fired 6 times and correctly
no-opped each time; the probe times out cleanly in 8.0s; the peer genuinely shows
`tx 93756 rx 0` — we send, it never answers. That machine is off, and no amount
of checking will change it.

The defect was in **my reporting**, not the link. The observatory now carries
both channels:

```
Escalations queued  2 · 2 readable on remote · oldest 1.9h
```

## Also corrected

I have been saying "hours". The oldest escalation is **1.9 hours** old. Second
time this session I have inflated that number while complaining about the queue —
I corrected it once already and drifted straight back.

| Measurement | Reported | Actual |
| --- | ---: | ---: |
| escalations Shaan could read | 0 | **2** |
| channels monitored | 1 of 3 | 2 of 3 |
| oldest queued | "hours" | 1.9h |
| mailbox deliveries | 0 | 0 (genuinely) |

Gate self-test 7/7; verify exit 0.

## Residual

Herdr remains unmonitored, so 2 of 3 is the honest figure rather than 3 of 3.
And the mailbox route is still dead — worth keeping, because it is the only
*push* channel; the remote requires Shaan to look. But "he has not looked" and
"he cannot see it" are different states, and I have been reporting the wrong one.
