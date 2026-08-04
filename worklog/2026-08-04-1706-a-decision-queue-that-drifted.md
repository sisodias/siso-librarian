# Worklog: a decision queue that drifted

Date: 2026-08-04T17:06:54Z (generated filename)
Thread: what I have been asking Shaan to decide

## The thing I never checked

Seven decisions have sat unanswered all day **while I worked on the things they
describe**. I never re-read them.

A decision queue that drifts is worse than an empty one: it asks for judgement
on a situation that no longer exists.

```
3 of 7 were stale
```

## Decision 5 — already done

```
said:    "Six registered God Questions have no testable contract. 1 of 7."
actual:  7 of 7 carry criteria, falsifiers and watch triggers. I wrote them.
```

Marked **RESOLVED**, struck through, original text kept below so the numbering
stays stable and the record shows what changed.

## Decision 6 — off by 4.7x and misattributed

```
said:    "growing ~1GB/day"
actual:  4.68 GB today, hourly rate rising, root down to 16Gi
         91% of it is THIS AGENT — 1,490 requests, 4.25 GB
```

Rewritten with the measured rate, the attribution, the double-storage finding,
and the per-request override lead I found this morning.

## Decision 7 — blocked on the wrong thing

```
said:    "blocked on a rights judgement"
actual:  270,049 texts carry an explicit IA rights field and need no judgement.
         SELECTION was the blocker, and the Library answers it from book_subject.
         An 81-identifier want-list now exists.
```

Original text kept — it stands for the sparse-metadata cases, which is a real
but much smaller problem than the header claimed.

## The counter was lying too

After marking 5 resolved, `awaiting_decision.count` **stayed at 7**.

`blockedDecisions()` counts every `## N.` heading, and a struck-through heading
still matches. **A resolved decision would have been reported as pending
forever** — the observatory would have kept asking Shaan for something already
done.

Fixed, and proven with a fixture: struck through decision 2, count went 6 -> 5,
restored to 6.

| Measurement | Before | After |
| --- | ---: | ---: |
| decisions listed | 7 | 7 |
| **actually awaiting Shaan** | 7 | **6** |
| stale headlines | 3 | 0 |
| resolved items counted as pending | 1 (silently) | 0 |

Self-test 12/12; verify exit 0.

## What made this findable

I have spent the day correcting my own claims and never turned that on the
document whose entire purpose is to be read by someone else. The queue was the
oldest artifact in the repo and the least re-examined.
