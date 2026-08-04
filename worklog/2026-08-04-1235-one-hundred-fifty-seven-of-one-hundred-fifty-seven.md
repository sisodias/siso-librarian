# Worklog: 157 of 157

Date: 2026-08-04T12:35:17Z (generated filename)
Thread: settling the rate I refused to guess

## The result

```
surveyed          157
upstream-short    157
OUR-DEFECT          0
unreachable         0

records where local != upstream:  0
```

Every book with a local body under 2 KB has an upstream Gutenberg source that is
equally short — and in **every single record the byte counts match exactly**.
297 = 297. 390 = 390. 105 = 105.

The extractor is faithful. Not one book in the suspect set lost text that
upstream had.

## What the two anecdotes actually were

gid 4715 (4 bytes upstream) and gid 9320 (66 bytes) were real. They were also
the low end of a population of **genuinely short or textless records**:

```
Symphony No. 5 in C minor Opus 67
Franz Haydn's 104th Symphony [1794-5] MIDI file
Photos and Maps of Trinity (Atomic Test)
The Secret Guide to Computers
QREAD, Etext Reader for Windows
```

Sheet music, MIDI, photographs, software manuals. A "book" with no prose is not
a defect in a corpus that ingested Gutenberg wholesale.

Last loop I wrote *"157 under 2 KB is not 157 defects"* and refused to report a
rate from two samples. That was right, and the measured answer is stronger than
the caution: **the rate is zero.**

## Two bugs the smoke test caught

I ran 8 before committing to 168 network requests.

A Gutenberg title containing a **newline** split into a phantom row with an empty
gid, which reached the JSON writer and corrupted the entire output. Fixed by
stripping CR/LF in SQL, plus a numeric-gid guard so no malformed record can
destroy a whole survey again.

Then `surveyed 9` for 8 printed rows — the row that breaks the loop was counted
before the break. A small lie, and the kind that would have made 157 read as 158.

The smoke test cost 8 requests and caught both. Running 168 first would have
produced a corrupt file after three minutes of load on a volunteer archive.

## Rate limiting

One second between fetches, deliberately. gutenberg.org is volunteer-run; the
sleep costs me three minutes and costs them nothing.

| Measurement | Before | After |
| --- | ---: | ---: |
| suspects tested | 2 of 157 | **157 of 157** |
| confirmed our defects | unknown | **0** |
| local vs upstream mismatches | unknown | **0** |
| rate established | no | **yes** |

Verify exit 0.

## The caveat that survives

This surveys bodies **under 2 KB only**. A book with 50 KB locally and 500 KB
upstream would be a silent partial extraction and would not appear anywhere in
this result. That is a different survey with a different threshold, and I have
not run it.
