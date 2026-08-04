# Worklog: a rule that existed only as a count

Date: 2026-08-04T16:57:57Z (generated filename)
Thread: resolving the one flagged item

## The flagged item, resolved

```
collection    opensource        <- the user-upload collection
sponsor       none
licenseurl    none
date          2025-10-23
creator       "Uploaded for the author by Harsh Kapoor, SACW.NET"
```

A 2025 book by a living author, uploaded by a third party, tagged *"Public
Domain License"* — which is not a designation that exists.

**Still in the list, still flagged.** Removing it on those grounds would be the
copyright judgement I keep declining; the evidence grade now says exactly what
it is, which is the part that was missing.

## Then the sample showed something else

Checking whether the other 105 came from institutional collections:

```
s1id13404310             wellcomejournals, wellcomelibrary
theartofconfecti30121gut gutenberg      <-
thestarkmunrolet00290gut gutenberg      <-
s1id11854980             wellcomejournals, wellcomelibrary
foodforthetravel27245gut gutenberg      <-
```

**Three of five were Gutenberg mirrors** — the source the Library already
ingests wholesale. 25 of my 106 identifiers ended in `gut`.

Title dedup could not catch them: IA titles differ slightly from Gutenberg's —
*"Ermeline a ballad"* against *"Ermeline: A Ballad"* — so normalised titles do
not match even though the works are identical.

## The part worth keeping

The original want-list **already excluded these**. It records:

```
gutenberg_mirrors_excluded: 1
```

A **count**. Not a rule. The exclusion was an act someone performed, and the
artifact recorded that it had happened rather than how to do it again. So my
generator faithfully reproduced a solved problem.

> A constraint recorded as its result cannot be re-applied.

Now implemented as a rule, with the reasoning inline.

## After

```
items                       106 -> 81
gutenberg mirrors excluded         309
```

309 against 25 visible, because most mirrors were already dropped by title dedup
before reaching the identifier check.

And the `jurisdiction-scoped` grade **vanished entirely** — all 25 *"Public
domain in the USA."* items were Gutenberg mirrors. A whole evidence tier was an
artifact of a source I should not have been fetching.

| Measurement | Before | After |
| --- | ---: | ---: |
| candidates | 106 | **81** |
| Gutenberg mirrors | 25 in list | **309 excluded** |
| provenance tiers | 5 | 4 |
| flagged for a human | 1 | 1 (resolved, retained) |

Verify exit 0.
