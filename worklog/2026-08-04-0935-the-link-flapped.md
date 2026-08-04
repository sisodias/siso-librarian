# Worklog: the link flapped, and why that vindicates the file

Date: 2026-08-04 09:35 UTC (from `date -u`)
Thread: escalation channel + rescue durability

## Ten minutes of reachability

The laptop was offline ~00:25–09:20 UTC, came back long enough to accept the five-decision message, and **went offline again within roughly ten minutes**. Three consecutive ssh timeouts; `tailscale status` now reads `relay "sin"; offline, tx 2652 rx 0` where minutes earlier it showed a direct connection.

I noticed because a follow-up command failed mid-flight, not because I assumed the link would hold.

## Why the message survived

Because it was never only a message. `proposals/2026-08-04-decisions-awaiting-shaan.md` was written first, committed, and surfaced on the observatory; the mailbox send was opportunistic. When a few-minute window opened, there was something ready to send, and delivery was confirmed by listing the directory rather than trusting an exit code.

Had I treated the mailbox as the escalation mechanism rather than transport for a durable artifact, nine hours of blocked decisions would have depended on catching an unpredictable ten-minute window. That design choice was made under uncertainty and this is the first evidence it was right.

## Rescue durability, re-checked rather than assumed

While the link was down I went back to the single-copy work, and re-verified rather than trusting yesterday's result:

- 5 rescue refs still anchored under `refs/rescue/domain-batch-backend/`
- vault bundle present at **651,653,470 bytes**
- `git bundle verify` **12 hours after creation**: still "records a complete history"

The bundle's size is now a declared derivation, so it is re-derived on every `npm run verify` — 10 declared derivations across 29 sources, zero mismatches. Bit-level loss on the vault becomes visible during routine verification instead of on the day someone needs to restore.

## The limit that has not moved

Both rescue copies live on **this one machine**. Local refs on the SSD, bundle on a USB-2 vault with SMART unreadable through the bridge. Neither is offsite.

Pushing them somewhere requires knowing which remote is appropriate for history touching CAM4 VPS and circuit-breaker logic — decision 2 in the queue, now delivered, still open. Checking integrity more often is not the same as having a second copy, and I would rather say that plainly than let ten green derivations imply durability I have not achieved.

## Residual

The channel is real but unreliable: two transitions observed in one session. Anything that matters continues to go into the repo first and the mailbox second.
