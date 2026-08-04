# Worklog: agreement is not evidence

Date: 2026-08-04T08:31:54Z (generated filename)
Thread: the defect I found four times by luck

## The pattern

Four times in one session, the same shape:

```
person_topic vs person_content     ->  76,106 against a true 90,209
bucket_counts. prefix vs bare key  ->  42 undeclared against a true 24
hyphen vs underscore               ->  0 source inventories against a true 6
work id vs filename                ->  25 orphaned works against a true 0
```

**A checker keyed differently from the thing it checks.** Every one produced a
confident wrong number rather than an error, and every one was found by accident.

The reason no gate catches it is that all my gates test **agreement**, and
agreement cannot distinguish a derivation that reads its source from one that
happens to return the same number for an unrelated reason. A derivation counting
the wrong directory agrees perfectly whenever the two hold the same count. One
whose source vanished agrees with a stale snapshot forever.

## What I built instead

`derivation-sensitivity.mjs` does not check agreement. It points each declared
derivation at an **empty directory** and an **absent path**, and requires the
answer to change. A derivation that returns the same value whether its source
exists or not was never reading it.

It reuses the audit's own `derive()` by extracting it from the source rather
than reimplementing it — a second implementation would drift, and then this
would be testing a resolver nobody uses.

All 37 declared derivations pass.

## My first fixture was wrong and that mattered

I injected a deliberately insensitive derivation to prove detection works. It
was **not detected**, and the reason was a real hole rather than a bad fixture:

`text-match-count` on a missing file **throws**, and I was counting 'threw' as
movement. So an insensitive derivation that errors on a bad path looked
sensitive. An exception proves the path was touched, not that its contents were
read.

Tightened to require a genuine value change. Re-checked the real 37 under the
stricter rule — still all sensitive — then re-injected:

```
DETECTED: fake.insensitive | real 0  empty 0  absent 0   (exit 7)
```

Had I stopped at the first run, I would have shipped a sensitivity check that
could not detect insensitivity, which is exactly the class of thing it exists to
find. The check would have been the fifth instance of its own defect.

| Measurement | Before | After |
| --- | ---: | ---: |
| derivations proven to read their source | 0 of 37 | **37 of 37** |
| verify chain steps | 5 | **6** |
| gate self-test cases | 8 | **9** |
| detectors for the four-times defect | 0 | 1 |

Self-test 9/9; verify exit 0.

## Limits

Sensitivity proves a derivation reads **something at its named path**. It does
not prove the path is the *right* one — a derivation counting the wrong
directory is fully sensitive to that wrong directory. So this would have caught
the hyphen/underscore case (a missing path returning 0) but **not**
`person_topic` vs `person_content`, where both paths exist and hold real data.

Two of the four. That is worth having and worth stating precisely, rather than
letting "detector for the four-times defect" imply it catches all four.
