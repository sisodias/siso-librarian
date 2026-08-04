# Worklog: I quoted three books we already own

Date: 2026-08-04T16:16:31Z (generated filename)
Thread: building the dedup I said should come first

## Built it

`scripts/ia-title-dedup.mjs`, **74,674 Library titles indexed**. Normalisation
validated against real cases rather than invented ones:

```
"Adventures of Pinocchio"            matches "The Adventures of Pinocchio"
"The Notebooks of Leonardo Da Vinci" matches "... — Complete"
```

Leading articles, em-dash edition suffixes, apostrophes, case.

## Then it killed my own proposal

An hour ago I escalated the subject filter as a third option for decision 7:
**1,264 candidates**, with three sample titles offered as evidence it worked.

```
40 titles sampled from that science-fiction pool
39 ALREADY IN THE LIBRARY        97.5% overlap
```

Including all three I quoted:

```
Vulcan's Workshop      gid 29321
Wanderer of Infinity   gid 29408
Planet of Dreams       gid 30045
```

**I had the dedup half-written when I sent that message and did not run it
against my own examples.**

The matching gids cluster at 29,000–30,000 — both corpora appear to come from
the same Gutenberg science-fiction ingest. The IA pool largely mirrors what is
already here.

Honest number: **~30 new books, not 1,264.**

## What was right and what was not

The 99.5% reduction from 270,049 to 1,264 was **real** — the subject filter does
work. What I never tested was whether the survivors were **new**, which is the
only thing that makes the filter useful.

I reported a funnel's output as though it were its yield.

## A measurement error I caught mid-check

My first overlap run reported *"154 checked"* from 40 titles — shell word
splitting had broken multi-word titles into separate arguments, so it measured
**fragments**. The 16.9% it produced was meaningless. Re-ran passing the titles
as a proper argument list to get 97.5%.

Two errors in one loop, one caught before publishing and one after.

| Measurement | Claimed | Actual |
| --- | ---: | ---: |
| candidates from the filter | 1,264 | 1,264 (correct) |
| **new** candidates | implied 1,264 | **~30** |
| sample titles that were new | 3 of 3 | **0 of 3** |
| Library titles indexed | — | 74,674 |

Escalation retracted in place; verify exit 0.

## Worth keeping

The dedup tool is now real and registered as `npm run ia:title-dedup`. It
replaces an author-only check built on the false premise that the Library had no
titles — and its first act was to disprove a proposal I had already sent.
