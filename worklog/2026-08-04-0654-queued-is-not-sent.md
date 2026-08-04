# Worklog: queued is not sent

Date: 2026-08-04T06:54:22Z (generated filename)
Thread: escalation channel — GQ-009 "connected to approved action"

## The finding

`outbox/sent/` was **empty**. Not one escalation has ever been delivered.

I have been reporting messages as "queued" for hours in a tone that implied
they were on their way. They were not. `mailbox-flush.sh` works correctly —
I tested it when I wrote it — but **nothing ever called it**. It was an npm
script, run only when I remembered, and I did not remember.

I also mis-stated the count last loop: three queued. There are **two**.

## The part that matters

I read "link: down" as an outcome. It is an explanation. Those are different,
and the difference is exactly the gap between a channel that is degraded and a
channel that is not running — I could not tell them apart because I was reading
the same string in both cases.

This is the same shape as every other real defect this session: the mechanism
existed, was correct, and was never actually exercised end-to-end. Gates check
that a recorded value matches its source. Nothing checked that a *pipeline ran*.

## What I fixed

1. **Corrected the queued message before it was ever sent.** The IA escalation
   still carried "accept a small high-confidence corpus" — the "dozens, not
   thousands" claim I corrected in the repo last loop. Because it had never
   been delivered, it was still editable. It now carries the measured 270,046
   and the two surviving options. The wrong figure never reached Shaan.

2. **Automatic drain.** `ops/launchd/com.siso.librarian-mailbox.plist`, loaded
   and verified running: fired at load, exited 0, correctly no-opped with the
   peer down. The queue now drains whenever the laptop appears, without me.

3. **Made the queue visible.** `escalations` in the snapshot and an
   `Escalations undelivered` row on the observatory, carrying `delivered_ever`
   and the **age** of the oldest — because a queue that is merely non-empty
   looks identical on hour one and day five.

## Two errors caught while fixing it

`readdirSync` was not imported. The builder would have crashed on first run;
I caught it by checking the import line rather than assuming.

The scratch clone reported `oldest_queued_age_hours: 0` for a 1-hour-old
message. Not a bug — `--dirty` re-commits the working tree, so
`git log --diff-filter=A` returns the *scratch* commit time. Worth recording:
**`--dirty` mode invalidates any check that reads git history.** Verified
against the live repo, where it reads 1h correctly.

That also corrects my own prose: the oldest escalation is **1 hour** old, not
"hours". I inflated it in the same breath as complaining about undelivered mail.

| Measurement | Before | After |
| --- | ---: | ---: |
| escalations ever delivered | 0 | 0 (link still down) |
| automatic drain | none | every 10 min, verified running |
| queue visible in observatory | no | yes, with age |
| queued messages | "3" (wrong) | 2 |
| wrong IA figure in queue | present | corrected |

## Honest residual

Delivery count is still zero, and I cannot change that — the peer is genuinely
offline (ping 100% loss, ssh timeout). What changed is that it will no longer
stay zero *by neglect*. The escalations remain readable in `outbox/` and now on
the observatory, which is the channel that has been working the whole time.
