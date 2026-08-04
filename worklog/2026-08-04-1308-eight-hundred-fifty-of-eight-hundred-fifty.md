# Worklog: 850 of 850

Date: 2026-08-04T13:08:10Z (generated filename)
Thread: turning a weak sample into a survey

## What I said and then did

*"Six of 693 proves nothing about a rate. A 1-in-100 defect rate would very
likely produce six clean draws."*

That was honest and it left the question open. The band was small enough to
survey properly, so I surveyed it.

```
surveyed          850
upstream-short    850
OUR-DEFECT          0
unreachable         0

records where local != upstream:  0
```

**Every book with a body under 8 KB byte-matches its upstream Gutenberg source
exactly.** 850 of 850, no exceptions.

Six clean draws were compatible with a 1-in-100 defect rate. 850 of 850 is not.

## Reusing tested code rather than writing new code

The survey script already existed and had been debugged against 157 books — two
bugs found by smoke-testing first: a newline in a title that corrupted the JSON,
and an off-by-one in the count.

So I parameterised the threshold instead of writing a second script. That kept
both fixes and cost one edit.

It also left two stale strings behind: the header still said *"under 2 KB"* and
the progress line printed `< 2 KB` while surveying at 8000. Neither affects the
result, and both would have made the file lie to the next reader. Fixed before
the long run rather than after.

## A cross-check that needed no network

```
                      band (<8 KB)   corpus
avg bytes/passage         493.1       697.1
max bytes/passage         2,374       2,397
```

Short books average slightly shorter passages — expected. The **maxima are
near-identical**, so the band shows no anomaly the corpus does not. Two
independent methods, same answer.

| Measurement | Before | After |
| --- | ---: | ---: |
| books fetched and compared | 157 + 6 sampled | **1,007** |
| coverage of the corpus | 0.2% | **1.1%** |
| extraction defects found | 0 | **0** |
| local vs upstream mismatches | 0 | **0** |

Verify exit 0.

## Rate limiting mattered here

850 requests at one per second against a volunteer-run archive — about fifteen
minutes. I let it run in the background and checked progress rather than
removing the sleep to finish faster. The archive costs nothing to be patient
with, and there was no deadline but my own impatience.

## Still invisible

Bodies **under 8 KB only**, 1.1% of the corpus. A 300 KB book truncated to
200 KB would not appear anywhere in this result. What is settled is the band
where truncation was plausible enough to suspect — the large-book case needs a
different signal than size alone, and I do not have one.
