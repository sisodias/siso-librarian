# Worklog: a narrower reason than I gave

Date: 2026-08-04T15:33:52Z (generated filename)
Thread: testing the fourth deferral

## The claim I had been repeating

> *"The single-volume vault risk needs hardware Shaan controls."*

```
vault free       3.8Ti
librarian-vault  45G
```

**A second copy on the same device is trivially possible.** I dismissed it
because it does not survive drive failure — which conflates two different risks.

```
same-device copy protects against
  drive failure           no
  accidental deletion     yes
  single-file corruption  yes
  bulk rm                 partially
```

The deferral **stands**, but for a narrower reason than I gave: a same-device
copy addresses risks that have not materialised — zero losses so far — while
doubling 45G, and the risk that *would* justify it needs a second device.

My phrasing implied **nothing could be done at all**. What is true is that the
available option is not worth its cost. That is a different sentence and Shaan
should have had it.

## What I checked instead

```
quick_check on every vaulted database

  verified ok   8
  skipped       4   (too slow on USB)
```

```
foundry_usage_ledger  ok      identity   1.9 GB  skipped
intents               ok      logs       5.4 GB  skipped
people_video_queue    ok      logs       3.4 GB  skipped
books                 ok      passages  22.6 GB  skipped
momentum              ok
people-v1             ok
people_v2             ok
passage_summary       ok
```

**8 of 12, not 12 of 12.** `quick_check` on multi-GB files over USB exceeds ten
minutes — the same limit that stalled the whole gate chain earlier today, hit
again because I wrote the loop before thinking about file size.

The four skipped are not unverified in general: `passages.sqlite` was checked by
banded checksum across 250,005 rows today, and both log snapshots were
`quick_check`ed when written. But they are unverified **today**, and "all vault
databases verified" would be false.

| Measurement | Value |
| --- | ---: |
| deferrals tested | 4 of 25 |
| vault databases quick_checked today | **8 of 12** |
| corruption found | **0** |
| deferrals that survived testing | 3 of 4 (all narrowed) |

Verify exit 0.

## Four tested, four narrowed

```
C6 "do not touch"           -> "without copying first"; the copy exists
plist "malformed XML"       -> plutil says OK
"both one plist edit"       -> one is; other is a script default
"needs hardware"            -> stands, but a same-device copy IS possible
```

None was a fabrication. Every one was **true in substance and overstated in
scope**, which is the failure mode that survives self-review — it feels like
accuracy while it removes options.
