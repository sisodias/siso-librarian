# Worklog: checking two of six is sampling, not an audit

Date: 2026-08-05T04:54:06Z (generated filename)
Thread: the other four decisions

## Why

Last turn I found decision 7 was describing work already done — **by reading
it**. The other five were written the same day, under the same conditions. I
checked two.

## All six, re-derived

| | verdict | evidence |
| --- | --- | --- |
| 1 MiniMax route | **holds** | upstream still `127.0.0.1:8080`; unapplied |
| 2 rescue refs | **holds** | 5 refs, 621 MB bundle |
| 4 Cloudflare ingress | **holds** | 8765 → 200 loopback and tailnet; cloudflared still pid 8611 |
| 6 bifrost log | **stale** | 136 rows → **16**; freelist 0 → **919,504** |
| 7 IA expansion | **stale** | re-scoped last turn |
| 8 oracle-gate | **holds** | 8.5 + 5.2 = **13.7 GB exactly** |

Decision 6 drifted because **I** changed the thing it described — built the
eviction, ran it, and left the decision quoting pre-eviction numbers. Updated
with a before/after table rather than a silent edit.

## Two scares that were my own measurement

**Port 8611 returned 000.** It is a **PID**, not a port — the decision says
*"pid 8611"*, and cloudflared is still running under it. I read a number and
assumed its type.

**`git worktree list` showed 39 where the decision says 19.** Breakdown: 22 in
`~/oracle-gate`, 17 elsewhere. My earlier count used a narrower set. The
figure that matters re-derived to **13.7 GB exactly** — 8.5 + 5.2.

Both looked like drift and were arithmetic of mine.

## The gap this leaves

**Nothing re-derives decision numbers automatically.** Metrics files have a gate;
the prose that asks for his attention does not. Both stale entries were caught by
hand, one turn apart — which is exactly the pattern I have spent the session
mechanising everywhere else.

Verify exit 0.
