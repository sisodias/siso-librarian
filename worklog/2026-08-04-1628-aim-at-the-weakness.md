# Worklog: aim at the weakness

Date: 2026-08-04T16:28:46Z (generated filename)
Thread: testing the inversion instead of naming it

## The remark I left lying there

> *"To find new books, filter for what the Library is **weak** in."*

I wrote that last loop as an aside and moved on. It is the whole consequence of
the rule I had just measured, and it took four queries to test.

## Tested

```
subject              library   IA pool   new%   est. new
Science fiction        3,291       535    2.5         13
Detective              1,013       128    3.3          4
Historical fiction     1,080        58    6.7          4
Cookery                  384        60   35.0         21
Essays                   243        77   33.3         26
English poetry           232        92   40.0         37
                                                    ----
                                                     105
```

**English poetry yields 40% new against science fiction's 2.5%** — a 16x
difference driven entirely by what this Library already holds.

The three **weak** subjects contribute **84 of the 105** despite pools an order
of magnitude smaller than science fiction's 535.

## Decision 7 now has a number

```
this morning   "1,264 candidates"        (untested for novelty)
after dedup    "~30 new"                 (science fiction only)
after inversion "~105 across 6 subjects" (weak subjects included)
```

Three estimates, each correcting the last, each from measuring something I had
previously assumed. The final one is still sample-based — 20 to 40 titles per
subject — so it carries real sampling error and is an estimate, not a count.

## The counter-intuitive part, stated plainly

You would normally deepen a collection's **strength**. Here the goal is books
the Library does not have, and strength is precisely where it already has them.

That inversion is the useful output of this whole thread, and it is worth more
than the 105 — it applies to any future source, not just IA.

| Measurement | Value |
| --- | ---: |
| subjects measured | 6 |
| novelty range | **2.5% – 40%** |
| estimated new books | **105** |
| from weak subjects | 84 of 105 |

Escalation updated; verify exit 0.
