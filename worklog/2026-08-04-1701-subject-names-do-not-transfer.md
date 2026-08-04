# Worklog: subject names do not transfer

Date: 2026-08-04T17:01:52Z (generated filename)
Thread: re-verifying a list that had changed under me

## Why re-sample

My fetchability check was **6 items taken before** the Gutenberg rule removed 25.
A sample of a list that has since changed is not a sample of the current list.

```
8 sampled, 8 with DjVuTXT
collections: rcplondon/ukmhl, universityofglasgow/ukmhl, rcpedinburgh/ukmhl,
             wellcomejournals, Princeton/americana, willanlibrary
```

All institutional, all fetchable, no user uploads. Good.

## And a pattern I would have missed by only counting

Every sampled identifier came from a **medical heritage library**. So I looked at
the titles.

```
weak-subject:Essays (30 items)
  The doctor &c
  The London magazine, or, Gentleman's monthly intelligencer. 1748.
  Horae subsecivae
  The dynamics of life
```

**Those are 18th-century medical serials, not essays.**

I derived my subjects from the Library's `book_subject` table and matched them
against IA's `subject:` field, assuming the terms meant the same thing.

## But not everywhere

```
weak-subject:English poetry        weak-subject:Cookery
  Nugae metricae                     Food and feeding
  Poets of Christian thought         The young cook's guide
  The classical tradition in poetry  Soups, broths, purées
  John Donne, his flight from...     Practical œconomy
```

**On subject, both of them.** The method works. One subject term — "Essays" —
is far looser on IA than in the Library's catalogue.

Which is the honest finding: not *"subject matching fails"*, but **subject names
do not transfer uniformly, and it has to be checked per subject rather than
assumed for the set.** That is the fifth over-generalisation risk this session,
and this time I checked before writing the conclusion.

| Measurement | Value |
| --- | ---: |
| sampled, fetchable | **8 of 8** |
| tiers on-subject | poetry, cookery |
| tiers off-subject | **Essays (30 of 81)** |
| candidates if Essays dropped | ~51 |

Verify exit 0; 30/30 grounding resolves.

## Recommendation, not action

Drop or re-scope the Essays tier. I have not done it — the list is evidence for
a decision Shaan holds, and silently removing 30 of 81 items after presenting
them would be worse than flagging what they are.
