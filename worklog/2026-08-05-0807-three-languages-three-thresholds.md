# Worklog: three languages, three measured thresholds

Date: 2026-08-05T08:07:01Z (generated filename)
Thread: the fifth want-list

## The Library

| | |
| --- | ---: |
| books | **458** |
| passages | **526,418** |
| words | **46.5M** |
| duplicates | 0 |

124 of 443 eligible fetched from a 1,100-candidate list — bounded batches rather
than asking a volunteer archive for 443 at once. Served page confirms 458.

## Two languages the filter did not know

Scoring the newly landed books found **104 of 105 English**. The one that was
not: *"Viaggio al Surinam e nell' interno della Guiana"* — **Italian**, 26.7%
dictionary hit. Then the corpus check found a second: *"Voyage à la Nouvelle
Galles du Sud"* — **French**, 30.8%.

## Each threshold measured, not assumed

**Italian.** A one-marker rule flags 3 of 1,100 and **two are English** —
*Sylva sylvarum*, and *The travels of Sig. Pietro della Valle* where "della" is
part of a **name**. Two markers flags exactly the Italian book.

**French.** An accent alone flags 4, and **three are English** using loanwords:
*catalogue raisonné*, *in search of La Pérouse*. Accent plus two still catches
La Pérouse. **Accent plus three** flags exactly the French book.

Both rules were chosen by counting false positives on the real pool. The pattern
matters more than either rule: **a filter tuned on one example is a filter that
excludes good books.**

## A case the existing Latin rule had already saved

*"Opera, historiam naturalem spectantia; or, gazophylacium. Containing several
1000 figures of birds, beasts, reptiles..."* — **Latin title, English body**. A
one-marker Latin rule would have thrown it out.

## The persistent failure

`b21500253` returned **170 bytes against a declared 1,008,087** across three
attempts. The sidecar exists at full size on IA — a persistent transient, not a
missing file. The guard refused to write it as a book, which is the whole point
of `BAD_BODY`.

Verify exit 0. Suites 4 pass, 0 fail.
