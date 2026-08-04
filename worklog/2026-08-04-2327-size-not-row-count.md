# Worklog: size, not row count

Date: 2026-08-04T23:27:59Z (generated filename)
Thread: "that remains open"

## The thing I identified and did not act on

Last turn I wrote: *"Row-count retention does not control this file — size does.
That remains open."* Naming a gap is not closing one.

The size is **one column**. `raw_request` holds **3.85 GB** of 5.4 — a
verbatim copy of my own prompt on every request. **Zero declared derivations
read it.**

I checked that against every `derivations` block in `metrics/` and the
observatory snapshot, **not** against a grep of whole files — a grep returns 20
hits, because those column names appear in prose describing the growth. The
distinction between a query and a sentence about a query has cost me five
mistakes in two days.

## Result

```
rows pruned      2,999
freelist pages   0 -> 1,153,812   (4.40 GB reusable, 46% of the file)
file size        9.50 GB -> 9.50 GB
derivations      32 rederived, 0 unavailable, 0 skipped
tokens intact    1,290,186,717 prompt / 1,676,999 completion
```

**The file did not shrink and I am not claiming it did.** What changed is that
46% of its pages are now free for reuse, so new rows land in reclaimed space
instead of extending the file. That is the bounded win available without a
rebuild.

## Three things the dry run on a copy caught

**VACUUM failed — "database or disk is full".** It rebuilds alongside the
original, needing ~2× the file size: 9.5 GB against 19 GB free, with a live
gateway writing throughout. On the real database that lands mid-rebuild.

**The copy itself took free space 28Gi → 19Gi.** My own safety measure was the
thing that made the operation unsafe.

**A derivation read 45264719 where 45285517 was expected.** Not a defect — my
earlier eviction removed 136 rows including CodexOpenAI ones, and the slice
preserves the pre-deletion total. That is precisely what the slice is for.

## A guard that would have blocked itself forever

The pre-delete check compared the slice against **live** and refused at 1/5.
After the first successful eviction, live and slice **always** differ — that is
what an archive is. A guard reading that as "stale slice" refuses permanently
after its first success.

Now it probes the slice directly: does it **answer**, not does it agree with a
source that has moved on. An empty answer counts as failure, because two blanks
compare equal.

Verify exit 0.
