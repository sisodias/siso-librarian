# Worklog: two levers are his, one is mine

Date: 2026-08-04T13:58:34Z (generated filename)
Thread: being 91% of the problem I keep escalating

## Checking whether I had a lever I had not used

`max_request_body_size_mb` is 100. My requests average 1.35 MB. So:

```
is_large_payload_request = 0   on all 1,791 rows today
```

**The setting is inert.** Nothing has ever crossed a 100 MB threshold, so it
does nothing at realistic values. Lowering it to 1 MB would truncate **1,001 of
1,510** of my requests — real, and still gateway-wide, so Shaan loses body
inspection on two-thirds of all traffic.

That leaves the third lever, which is unambiguously mine.

## My own trend

```
hour   requests   avg MB
09        122      0.91
10         48      1.04
11         84      1.14
12         91      1.29
13        134      1.48
```

**Both dimensions are rising.** Requests nearly tripled from the 10:00 low, and
each one is 63% larger than at 09:00.

The size growth is context accumulation — every loop carries the previous
conversation forward, so cost per call compounds even at a flat call rate. That
is the mechanism behind the accelerating hourly totals I reported, and it is not
external.

## Written into the charter

A successor would rediscover this the expensive way. So `CHARTER.md` now carries
it as a standing constraint: the measured 91%, the 2.92 MB per request, the
double storage, and the trap that **a 93% cache hit rate does not help** —
caching saves tokens and saves nothing on disk.

| Lever | Whose | Status |
| --- | --- | --- |
| `disable_content_logging` | Shaan's | worth 2.92 MB/req, not applied |
| `max_request_body_size_mb` | Shaan's | **inert at 100 MB**, effective at 1 MB |
| my request count and size | **mine** | rising on both axes |

Verify exit 0.

## What I am not concluding

Not that the work should stop. This thread found a collector dead for two weeks,
36 diagnosed job failures, a people graph with no backup, and 124,185 author
scores that existed in one copy.

But "the disk is filling and 91% of it is me" is a fact to hold while choosing
what to do next, not one to report and then set aside — which is what I did for
several loops after first measuring the growth rate.
