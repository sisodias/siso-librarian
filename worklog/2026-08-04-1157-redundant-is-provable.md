# Worklog: redundant is provable

Date: 2026-08-04T11:57:52Z (generated filename)
Thread: the ranking problem I said knowing contents did not answer

## The question, made answerable

I said knowing what is in each database *"narrows the question without answering
it"* — which deserves which backup. For the PRE-* snapshots it **is** answerable:
a snapshot is redundant if every row it holds survives in the live database.

Counts cannot show that. A merge can swap rows while preserving totals. So each
check is an **anti-join on stable keys**.

```
people_v2.PRE-AWESOME-PROMOTE   1.08 GB
  rows in snapshot absent from live       0
  rows only in live                  37,137   (exactly the awesome promotion)

identity.PRE-MERGE               1.80 GB
  category slugs absent from live         0
  repo_category pairs absent from live    0

people_v2_gh.PRE-ENRICH          0.54 GB
  persons absent from live                0
  content edges absent from live          0
```

**3.42 GB provably redundant.** Not inferred from "live is bigger" — every row
individually accounted for.

## The join key that would have lied

For `identity.PRE-MERGE` the obvious join is `category_id`. That would have been
wrong: **a merge renumbers ids**, so matching on them compares *different
categories* between the two databases and yields a confident wrong answer.

Joined on `slug` instead. This is the seventh time this session the wrong key
would have produced a plausible number rather than an error, and the first time
I picked the right one *before* running it rather than after being burned. The
rule in CHARTER.md was written two loops ago; this is it working.

## What I did not conclude

**Redundant is not unwanted.** I have not deleted or moved these — C1 is
absolute, and a proven subset is still someone's chosen restore point. What
changed is narrower: they are no longer *backup candidates*. Copying a proven
subset of a live database to the vault would consume space to store nothing new,
and I would have done exactly that if I had ranked by size.

| Measurement | Before | After |
| --- | ---: | ---: |
| unbacked databases needing a decision | 12 | **9** |
| GB provably redundant | 0 | **3.42** |
| ranking basis | guesswork | anti-join per row |

Verify exit 0.

## Nine left

Of the remainder, four are small (< 0.05 GB), one is the corrupt cache I
escalated, and one is its partial recovery. That leaves three worth real thought
— and unlike the snapshots, none of them has an obvious live counterpart to test
containment against, so the same trick will not work twice.
