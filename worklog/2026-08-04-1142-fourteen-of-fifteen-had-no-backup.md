# Worklog: fourteen of fifteen had no backup

Date: 2026-08-04T11:42:51Z (generated filename)
Thread: the survey I said I had skipped

## The survey

Last loop I fixed one missing backup and said plainly that I had *"checked one
thing, found it missing, and fixed that one thing rather than surveying the
directory."* So I surveyed it.

**Fifteen databases under `~/foundry-data`. One had a backup.** The one I made
last loop.

## Prioritising by dependence, not size

The largest unbacked file is not the most important. I ranked by what my claims
and metrics actually cite:

```
people_v2.sqlite   17 citations   backed up last loop
logs.db            12            backed up (gateway snapshot)
passages.sqlite    10            backed up
identity.sqlite     2            NO BACKUP  <- 1.88 GB
```

`identity.sqlite` is the GitHub taxonomy — and it is the database that
**resolved the GQ-005 dispute**. When I found that claim asserting 929 repos for
`agent-memory-store`, this is where the real 181 came from. The evidence behind
an active dispute had no copy.

Backed up (WAL, so `.backup` not `cp`), and verified:

```
quick_check                    ok
category                       live 264  vault 264  MATCH
repo_category (first 5 cats)   live 874  vault 874  MATCH
agent-memory-store             live 181  vault 181  MATCH
```

That last line is the number that disproved a claim. It now survives the disk.

## Two things that went wrong

**A count sweep timed out at ten minutes.** Five `count(*)` queries against the
1.88 GB vault copy — the same failure as the 24 GB passage index, and I walked
into it again one loop later. Verification on external storage must use bounded
queries; whole-table counts are only affordable for the 1.09 GB graph. Recorded
so the next attempt does not rediscover it a third time.

**My survey produced a false positive.** It reported `people.sqlite` as
BACKED-UP. It is not — the glob matched `people_v2*` **by prefix**. Prefix
matching gave a confidently wrong answer, which is exactly the wrong-key pattern
I wrote into CHARTER.md two loops ago. Writing the rule down did not stop me
making the error; noticing that `people.sqlite` and `people_v2.sqlite` are
different files did.

| Measurement | Before | After |
| --- | ---: | ---: |
| foundry databases surveyed | 0 | **15** |
| with a vault backup | 1 | **2** |
| claim-cited databases unbacked | 1 | **0** |
| false positives in my own survey | 1 | 0 |

Verify exit 0.

## Thirteen still unbacked

Mostly PRE-MERGE and PRE-ENRICH snapshots — `identity.PRE-MERGE` 1.80 GB,
`people_v2.PRE-AWESOME-PROMOTE` 1.08 GB — which are themselves backups of
earlier states, so their loss would be less severe. `books.sqlite` at 0.17 GB is
the one I would look at next, since no claim cites it and I do not know what it
holds.

Every claim-cited database now has a verified vault copy. That is the line I was
aiming for, and it is a narrower achievement than "foundry-data is backed up".
