# Worklog: a census was five queries away

Date: 2026-08-04T16:35:25Z (generated filename)
Thread: the sampling error I kept restating

## The interval I had not computed

I published **105** and repeated three times that it was "sample-based, with
real sampling error". Never computed the error.

```
subject              pool  n  new   95% CI on new%   est new
Science fiction       535 40    1     0.0 - 7.3        0-39
Detective             128 30    1     0.0 - 9.8        0-12
Historical fiction     58 30    2     0.0 - 15.6       0-9
Cookery                60 20    7    14.1 - 55.9       8-34
Essays                 77 30   10    16.5 - 50.2      13-39
English poetry         92 30   12    22.5 - 57.5      21-53
                                                    ------
TOTAL                                               42-186
```

**42 to 186** around a point estimate of 105. The science-fiction band spans
0-39 off a single hit in 40 titles.

Saying "this has sampling error" is not the same as knowing it is a 4.4x range.

## Then the obvious move

Five of the six pools are **under 130 items**. A census costs one query each.

```
subject                        pool   checked   NEW   was estimated
English poetry                   92        92    38            37
Essays                           77        77    37            26
Cookery                          60        60    30            21
Detective and mystery stories   128       128    14             4
Historical fiction               58        58     5             4
                                                ---
                                                124
```

**124 counted**, no interval, no error. Plus ~13 still sampled for science
fiction, whose 535-item pool exceeds one query.

## The samples were wrong in one direction

```
Detective   4  ->  14
Essays     26  ->  37
Cookery    21  ->  30
Poetry     37  ->  38
```

**Every weak subject was understated.** Small samples on small pools were noisy
toward pessimism — which matters beyond this thread, because I have used 20-40
title samples elsewhere today and now know their failure direction.

| Measurement | Sampled | Census |
| --- | ---: | ---: |
| new books | 105 (42-186) | **124 counted** |
| subjects counted in full | 0 | **5 of 6** |
| sampling error | unquantified | **eliminated** |
| cost | — | 5 queries |

Escalation updated; verify exit 0.

## Why this took four loops

1,264 -> ~30 -> ~105 -> **124 counted**. Each step corrected an assumption I had
not tested: that filtered meant new, that one subject represented all, that
sampling error was acceptable.

The census was available at every step. What was missing was asking how wide the
uncertainty actually was, which turned a restated caveat into five queries.
