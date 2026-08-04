# Worklog: the Library grew and the page that reports it said nothing

Date: 2026-08-04T22:26:45Z (generated filename)
Thread: making today's books visible

## The gap

78 books, 122,553 searchable passages, 9.8M words — ingested, catalogued and
indexed today. The observatory contained **zero mentions of any of it**.

Exactly the outbox defect again: content that exists, and nothing surfaces it.
Searchable only by someone who knows the vault path and writes SQL is not
searchable in any sense that matters.

## Now published

```
Source              Books    Searchable passages    Words
Project Gutenberg  77,540             41,501,325        —
Internet Archive       78                122,553    9,826,621
```

Live over the tailnet, verified by fetching the served page rather than trusting
the build. All three numbers carry **declared derivations**, so they are
re-checked on every push rather than asserted once.

The section also states plainly why the IA books are *not* in the passage index
— `gid INTEGER` is the Gutenberg Text# and 1,184,937 rows join on it — and why
search works anyway: FTS5 stores the id column `UNINDEXED`.

## Guarded against a confident zero

The vault is external storage and can be unmounted. The builder reports
**"vault not mounted — counts unknown, NOT zero"**. A zero there would state
that the books do not exist, which is a stronger and falser claim than silence.

## A comment I had to correct

I wrote *"Measured before declaring: under a second."* Then I timed it:
**4.3s cold**, sub-second warm.

I wrote a justification from expectation, inside a change whose entire purpose
is that numbers get checked. **A comment justifying a derivation has to be
checked like the derivation.** Corrected to the measured value.

## Three findings the gate raised on my own change

| Finding | Cause |
| --- | --- |
| `external_corpus.words` undeclared | I published a number without a derivation |
| `gate_selftest_cases` 14 vs 15 | added a case, did not update the count — **second time today for this number** |
| `lib/patch.mjs` unreferenced | nothing in the repo imports it; only my session tooling does |

All three fixed at source rather than by loosening anything.

Verify exit 0. Gate self-test 15 passed, 0 failed. 39 derivations declared,
36 independent checks, 0 skipped.
