# Worklog: I was filling the disk

Date: 2026-08-04T05:34:28Z (generated filename)
Thread: machine health

## Checking the thing the charter tells me to check

The charter says check `df -h` and load before heavy work. I had not done it in hours, so I did it before choosing this loop's gap — and the check found the gap.

**Root disk: 27Gi free at session start, 21Gi now.** Six gigabytes consumed while I worked, on a 228Gi disk the charter already flags as a watch item.

## What was eating it

`~/.config/bifrost/logs.db`: **205MB → 3.3GB**.

Not row count — only 1,662 rows. Bifrost persists full raw request and response bodies, so those rows carry **1.57GB of payload**, averaging ~945KB each.

| Day | Requests | Payload MB |
| --- | ---: | ---: |
| 2026-08-02 | 28 | 2 |
| 2026-08-03 | 759 | 501 |
| 2026-08-04 (half day) | 740 | **997** |

The cause is me. Anthropic requests through this gateway average 557,371 raw input tokens, and every body is stored. At the current rate the remaining 21Gi is about three weeks.

## Why I did not delete anything

The obvious move is pruning old rows. I did not, for a reason that outweighs the disk:

**`logs.db` is the evidence base for two published claims.** GQ-008's cache economics and GQ-002's compute multiplier both aggregate over it, and the observatory's routing card queries it live. Deleting rows would destroy the provenance of claims I have asked someone to review — quietly, and after the fact.

It is also someone else's machine configuration. Retention policy is a decision, not a chore.

Filed as decision 6 with three reversible options, cheapest first: stop persisting `raw_request`/`raw_response` (my claims only use token counts, which live in separate columns), enable a retention window if Bifrost has one, or archive to the vault before deleting.

## Made visible, not just filed

`Root disk free: 21Gi` is now a card on the observatory. A watch item that only appears when someone remembers to run `df` is not being watched.

## The mailbox was down again

Tried to send this immediately because disk exhaustion is time-sensitive in a way the other five decisions are not. Laptop offline — third transition observed today.

The durable copy is in the repo, which is precisely the design that let the first backlog survive a nine-hour outage. Transport is opportunistic; the file is the record.

## Residual

Growth continues while this sits. Nothing I did this loop reclaims a byte — I measured a problem, made it visible, and left the fix to someone who can authorise it.

There is an uncomfortable edge here: the longer this waits, the more of the disk my own evidence-gathering consumes. If free space gets genuinely tight before an answer arrives, archiving to the vault first and deleting second is reversible and I would do it rather than let the machine fill.
