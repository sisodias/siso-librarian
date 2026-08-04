# Worklog: a gate for the thing I kept missing

Date: 2026-08-04T08:05:12Z (generated filename)
Thread: coverage — the defect class I named three loops running

## The gap

Last loop I wrote: *"I don't have a gate for this — the self-test catches gates
that stopped firing, not counts that were never measuring what their name says."*

Naming a defect class three times and leaving it undetected is worse than not
noticing it, so I checked how big it was.

**24 of 47 numbers published on the observatory declared no derivation at all.**

Every check I had built verifies that a *declared* number matches its source.
None asked how many declared nothing. That is precisely the blind spot behind
three consecutive loops of the same failure — "7 claims awaiting review" hid a
re-derivable half, "2 escalations undelivered" were on the remote, "3 channels"
were two sharing one peer. Each figure was defensible. None was measuring what
its name implied, because nothing ever required it to name a source.

## I got the number wrong first

My first pass reported **42** undeclared. Wrong: derivation keys are `group.key`
while snapshot paths carry a `bucket_counts.` prefix, so I was comparing
mismatched shapes and 18 declared numbers looked undeclared.

That is the same error I made two loops ago against `person_topic` — **a checker
measuring the wrong key disagrees confidently**, and I nearly reported a much
worse figure than the truth. I found it by checking what the derivation keys
actually look like instead of trusting my first count. The prefix-stripping is
now in the code with a comment saying why.

## What I built and what I closed

`snapshot-undeclared-numbers` reports the ratio rather than failing on it,
deliberately: several numbers are un-derivable **in principle** — a live ssh
probe result, a count of files that failed to parse — and demanding a derivation
for those would push me to invent one that re-reads the stored value. That is
the exact failure the reproducible/derivable split exists to prevent.

Then I closed the ones with real sources: `scripts_on_disk`, `god_questions.total`,
`coverage.registered`, `release_integrity.releases`.

```
CAUGHT: repo_health.scripts_on_disk  1 -> 16  delta 15
CAUGHT: god_questions.total         99 ->  7  delta -92
```

Proven to catch wrong values, not merely to agree — and added as self-test case
8, so the coverage fix cannot itself become another quiet checker.

| Measurement | Before | After |
| --- | ---: | ---: |
| published numbers undeclared | 24 of 47 | **20 of 47** |
| counts independently re-derived | 23 | **26** |
| gate self-test cases | 7 | **8** |
| my first estimate of the gap | 42 | 24 (corrected) |

Verify exit 0; self-test 8/8.

## What is honestly left

Twenty numbers still declare nothing. Some cannot — but I have not gone through
them one by one to separate "un-derivable" from "not yet done", and until I do,
that 20 is a mixture I am describing rather than a set I have classified. The
gate now makes the mixture visible, which is the part that was missing; it does
not tell me which is which.
