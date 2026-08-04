# Worklog: a signature that needs no network

Date: 2026-08-04T12:39:46Z (generated filename)
Thread: the blind spot I named at the end of last loop

## The gap

*"A book with 50 KB locally and 500 KB upstream would be a silent partial
extraction invisible to this result."* True, and I left it there.

First I checked whether a **local** comparison was possible. `books.sqlite`
records Authors, Bookshelves, Issued, Language, LoCC, Subjects, Text#, Title,
Type — and **no source byte size**. There is no local oracle for how big a book
should be.

## So I looked for a signature instead

A partial extraction leaves body bytes that produced no passages. That inflates
**bytes per passage**, and both numbers are already on disk:

```
avg bytes/passage      697.1
min                     75
max                  2,397
books over 20,000       0
```

A tight distribution across all 77,540 books. The maximum is **3.4x the mean**,
not the order of magnitude a truncated extraction would produce. Zero outliers.

This covers the entire corpus, which the fetch survey cannot — 77,540 network
requests would be an abuse of a volunteer archive.

## Then I sampled the band I had actually missed

The previous survey stopped at 2 KB. The unexamined range is Text-type books
between 2 and 8 KB — **693 of them**. Six at random:

```
36584   local 6302   upstream 6302   MATCH
27654   local 7250   upstream 7250   MATCH
34622   local 7970   upstream 7970   MATCH
18341   local 4797   upstream 4797   MATCH
16905   local 5640   upstream 5640   MATCH
29948   local 4779   upstream 4779   MATCH
```

Six for six, byte-exact.

| Check | Coverage | Result |
| --- | --- | ---: |
| fetch, under 2 KB | 157 of 157 | **0 defects** |
| fetch, 2-8 KB band | 6 of 693 | **0 defects** |
| bytes-per-passage signature | 77,540 of 77,540 | **0 outliers** |

Verify exit 0.

## What six draws prove

Not much on their own. **A 1-in-100 defect rate would very likely produce six
clean draws** — that is what sampling six of 693 buys, and I am not going to
call it a survey.

What changed is that the blind spot is sampled rather than merely acknowledged,
and the signature test covers every book where the fetch test covers 0.2% of
them. Three checks pointing the same way is weaker than one exhaustive check and
much stronger than the assertion I made last loop.
