# Worklog: 97% was the best case

Date: 2026-08-04T17:20:30Z (generated filename)
Thread: decision 1, the one I called highest-value all day

## Re-run, four times

```
cached   128 of 1,078   11.9%   cold entry
cached   896 of 1,078   83.1%
cached 1,024 of 1,078   95.0%
cached 2,944 of 3,033   97.1%   the original, this morning
```

**The direction holds on every run without exception**: the proxy caches a
non-zero amount, Bifrost returns exactly 0.

**"~97% input-token saving" does not.** That was the best case on a warm cache,
quoted as though it were the expected value, in the headline of the decision I
have been calling highest-value since this morning.

Honest version: **12-95%, depending on cache warmth.**

## And a correction that never propagated

The same decision said repointing *"changes gateway topology for every agent on
this machine"*.

I corrected that six loops ago — the patch is gated on
`effectiveModel === 'MiniMax-M3'` and touches **73 of 1,986 requests, 3.7%**.
I fixed it in the handover and the metrics and **never carried it into the
decision file itself**, which is the document Shaan would actually read when
deciding.

## All five open decisions now re-verified

```
1  MiniMax repoint      headline was best case      -> range, scope corrected
2  rescue refs          fallback unverified         -> verified, question narrowed
3  SEC-F16              (resolved: zero commits)
4  Cloudflare ingress   accurate                    -> unchanged, holds
5  God Question contracts (resolved: 7 of 7)
6  Bifrost log          ~1GB/day                    -> 4.68 GB/day, 91% is me
7  IA rights            wrong blocker               -> selection, want-list built
```

Two resolved, four corrected, one held. **Every decision in the queue was stale
or overstated except decision 4.**

| Measurement | Before | After |
| --- | ---: | ---: |
| decision 1 headline | "~97%" | **12-95%** |
| decision 1 scope | "every agent" | **3.7%** |
| open decisions re-verified | 0 of 5 | **5 of 5** |
| runs behind the number | 1 | **4** |

Verify exit 0.

## What this says about the queue

I built it this morning and left it. Every hour since, I measured things that
contradicted it — the 3.7%, the 4.68 GB, the 7-of-7 contracts, the want-list —
and updated worklogs and metrics files while the document **addressed to Shaan**
kept its original wording.

The artifact meant for someone else was the last one I kept true.
