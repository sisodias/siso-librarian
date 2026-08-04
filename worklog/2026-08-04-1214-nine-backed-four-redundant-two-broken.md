# Worklog: nine backed, four redundant, two broken

Date: 2026-08-04T12:14:57Z (generated filename)
Thread: the survey that began at 1 of 15

## Complete

```
total databases        15
backed up + verified    9
proven redundant        4
corrupt (escalated)     2
unbacked                0
```

When I started this thread, **one** database had a vault copy — the one I made
after discovering the people graph had none.

Every backup verified by `pragma quick_check` **plus** at least one row-count
comparison against live. None accepted on exit code alone, because `.backup`
returning 0 says nothing about whether the copy answers queries.

## Why I stopped ranking

Two databases were left and I had said twice that my ranking was unreliable.
Rather than build a third proxy, I copied both.

```
books.sqlite    uncited   -> the bibliographic catalogue
people.sqlite   0.03 GB   -> the only copy of 124,185 author scores
```

Both proxies failed in the same direction: they made me deprioritise the thing
that mattered. With two candidates left, **ranking cost more than copying** —
the analysis to decide was more expensive than the 0.05 GB of decision it would
have saved.

Then I ran a full status sweep rather than trusting my own list, and it caught
one I had missed: `people_video_queue.sqlite`, 97 rows. Backed up too. 14 of 15
would have felt finished; the sweep is the reason it is 15.

## What "redundant" and "corrupt" mean here

Neither is a euphemism for deleted. The four redundant files are **still on
disk** — proven contained in their live counterparts by per-row anti-join, so
copying them to the vault would store nothing new. The two corrupt files are
also still on disk, escalated and untouched.

Under C1 nothing was removed at any point in this survey.

| Measurement | Start | Now |
| --- | ---: | ---: |
| databases with a verified backup | 1 | **9** |
| unbacked and unexplained | 14 | **0** |
| bytes deleted | 0 | **0** |

Verify exit 0.

## The remaining risk is not backups

Every database is now copied, proven redundant, or flagged broken. What is not
solved: the vault is a **single external volume**. Everything I have verified
this session protects against disk failure on the mini and against nothing else
— one dropped drive and all nine copies go together.

That is worth saying plainly rather than letting "9 of 9 backed up" imply more
safety than it buys.
