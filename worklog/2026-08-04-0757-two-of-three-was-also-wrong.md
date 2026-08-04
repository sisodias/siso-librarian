# Worklog: two of three was also wrong

Date: 2026-08-04T07:57:48Z (generated filename)
Thread: escalation channels — correcting the correction

## Last loop I corrected myself and got it wrong again

I reported "2 of 3 channels monitored" and named herdr as the unwatched third.
Then I read my own charter:

```
ssh ... shaansisodia@100.118.29.68 "~/.local/bin/herdr pane list"
```

**Herdr runs on the laptop.** Same peer as the mailbox, `100.118.29.68`. It is
not a third channel — it is the same dead machine reached by the same ssh. When
the mailbox is down, herdr is down, always, by construction.

And the charter itself calls the worklog "durable record, **not transport**".

So the honest count is not 2 of 3. It is:

| route | transport | status |
| --- | --- | --- |
| git remote | **pull** — Shaan must look | working |
| mailbox | push | down |
| herdr | push — *same peer as mailbox* | down |

**Zero working push routes.** Nothing I write reaches Shaan without him choosing
to look. I had been describing redundancy that does not exist: three routes that
are really one working pull channel and one dead push peer wearing two names.

## Measured, not asserted

I first wrote `independent_push_routes_up: 0` as a literal — which is the
hardcoded-banner failure I removed from the routing row two days ago, reproduced
by me, in the same file, while writing about honest reporting.

It is now derived from a live ssh probe, and I checked that the `up` branch
actually fires rather than assuming: probing `shaansisodia@127.0.0.1` returns
`would report 2`. The count moves with reality instead of agreeing with me.

## Charter corrected

Escalating "via herdr instead" reads as a sensible fallback and is not one. The
charter now says so at the point where a future agent would reach for it, with
the measurement that established it (`tx 93756 rx 0` for the whole session).

| Measurement | Reported | Actual |
| --- | ---: | ---: |
| channels monitored | 2 of 3 | 2 of 2 real |
| independent push routes | implied 2 | **0** |
| working routes to Shaan | 1 | 1 (pull only) |

Gate self-test 7/7; verify exit 0.

## The pattern I keep hitting

Three loops running, the defect has been the same shape: **a count that implies
independence between things that share a failure**. Seven claims "awaiting
review" hid a re-derivable half. Two escalations "undelivered" were on the remote.
Three channels are two, and both push routes are one peer.

Each time the number was defensible and the structure behind it was not. I do not
have a gate for this — the self-test catches gates that stopped firing, not
counts that were never measuring what their name says.
