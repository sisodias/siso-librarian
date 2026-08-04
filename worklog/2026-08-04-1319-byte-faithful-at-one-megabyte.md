# Worklog: byte-faithful at one megabyte

Date: 2026-08-04T13:19:27Z (generated filename)
Thread: probing where the local signals are blind

## The specific blindness

The trailing-gap test proves the extractor consumed the body it was **given**. If
`body_end` was recorded wrong at extraction time, the last passage aligns with
that wrong value and the gap reads zero — a clean bill of health for a truncated
book.

Only an upstream fetch catches that. And every fetch so far was of books under
8 KB, which is exactly the wrong end of the size range for this failure.

## Stratified probe

```
50k-150k band
  60392   local 51,335      upstream 51,335      MATCH
  49021   local 50,707      upstream 50,707      MATCH
  54712   local 67,416      upstream 67,416      MATCH
  56930   local 132,083     upstream 132,083     MATCH

over 400k
  65266   local 666,125     upstream 666,125     MATCH
  46857   local 781,252     upstream 781,252     MATCH
  44822   local 1,136,066   upstream 1,136,066   MATCH
  46754   local 1,146,343   upstream 1,146,343   MATCH
```

**Eight of eight, byte-exact**, at up to **1.15 MB**. The extractor is faithful
at a megabyte as well as at a hundred bytes.

## An error that looked like a result

My first query returned nothing. Not an error message, no rows — which reads as
"the sample came back empty" and would have been easy to shrug at.

I had piped stderr to `/dev/null`. Rerunning without it:

```
Error: in prepare, ORDER BY clause should come after UNION ALL not before
```

**An empty result and a suppressed syntax error are indistinguishable.** I
discarded stderr and then went back for it, which is the only reason this
worklog contains eight measurements instead of a shrug. The same habit that let
a pipe hide exit code 8 two loops ago.

| Coverage | Books | Defects |
| --- | --- | ---: |
| under 8 KB | 850 (complete) | 0 |
| 50k-150k | 4 sampled | 0 |
| over 400k | 4 sampled | 0 |
| trailing gap | 77,539 (100%) | 0 |
| bytes per passage | 77,539 (100%) | 0 |

Verify exit 0.

## What eight books buy

Not a rate. Eight across two bands is a probe, and a 1-in-50 defect rate would
comfortably survive it.

What it buys is that the failure mode I **could not rule out locally** now has
direct evidence against it at the sizes where it would do the most damage. Two
corpus-wide signals plus 1,015 fetched books, all agreeing, is the strongest
statement I can make without fetching 77,540 files from a volunteer archive —
which I am not going to do.
