# Worklog: the signal I said I did not have

Date: 2026-08-04T13:15:33Z (generated filename)
Thread: large-book truncation

## The claim I made and then tested

*"A 300 KB book truncated to 200 KB would still be invisible. That needs a
different signal than size alone, and I don't have one."*

There is one, and it was already on disk: **body_end minus the end of the last
passage**. A truncated extraction stops early, so the final passage would sit
far short of where the body claims to end.

```
books                                      77,539
last passage ends exactly at body_end      40,173
trailing gap over 500 bytes                     1
average gap                                   4.9 bytes
```

**One book** in the entire corpus has more than 500 bytes unconsumed. No network
needed, and it covers 100% of books where the fetch survey covers 1.1%.

## The single outlier

```
gid 23962   西遊記 (Journey to the West)
local body  785,317      passages 546      trailing gap 752
```

I fetched it rather than reasoning about it:

```
upstream body  785,317
local body     785,317
```

**Exact match.** Even the outlier is faithful — the 752 bytes are the passage
splitter leaving a CJK tail unconsumed, not text we lost.

## A false start worth recording

My first attempt tested whether the last passage ends with sentence punctuation.
It returned **17,069 of 77,539 — 22%**, which looked like a catastrophe.

It was not. `preview` caps at **160 characters**, with 41,610 passages sitting
exactly at the cap. It is a snippet, not the passage text, so I had measured the
truncation of the *preview field* rather than of the book.

I checked the field's distribution before acting on the 22%. Had I not, the
worklog would have opened with a corpus-wide alarm about a column doing exactly
what it was designed to do.

| Method | Coverage | Defects |
| --- | --- | ---: |
| upstream fetch | 1,007 books (1.1%) | 0 |
| bytes per passage | 77,539 (100%) | 0 |
| **trailing gap** | **77,539 (100%)** | **0** |

Verify exit 0.

## What the trailing gap cannot see

It proves the extractor consumed the body it was **given**. If extraction
recorded `body_end` at the wrong place to begin with, the last passage would
still align with that wrong value and the gap would be zero.

That case needs the upstream fetch — which is why these two methods complement
each other rather than one replacing the other. The fetch is authoritative and
expensive; the gap is free and covers everything.
