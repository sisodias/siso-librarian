# Worklog: 128, counted

Date: 2026-08-04T16:38:52Z (generated filename)
Thread: the last uncounted subject

## Pagination, not a limit

I left science fiction sampled because *"535 exceeds one query"*. IA supports
`&page=`. Three requests at 200 rows.

```
page 1   200 titles
page 2   200 titles
page 3   135 titles
```

The constraint was a query parameter I had not looked for.

## The result inverts my last conclusion

```
science fiction   462 unique titles checked
                  458 already held
                    4 NEW  (0.9%)

sampled estimate was ~13 (2.5%)
```

Last loop I wrote that small samples were *"noisy in the pessimistic
direction"* after four weak subjects came in understated. Science fiction was
**overstated by 3x**.

So the samples were **noisy in both directions**. What I called a systematic
bias was four draws landing the same way — I generalised from four points and
the fifth contradicted it.

## Final answer

```
subject                        pool   checked   NEW
English poetry                   92        92    38
Essays                           77        77    37
Cookery                          60        60    30
Detective and mystery stories   128       128    14
Historical fiction               58        58     5
Science fiction                 535       462     4
                                                ---
                                                128
```

**128 new books. Six subjects. Nothing estimated.**

## A detail worth carrying

535 search results collapsed to **462 unique titles** — 73 duplicates inside IA
itself, which the dedup absorbed silently.

**IA's reported pool size is not the number of distinct works.** Every earlier
figure in this thread that used `numFound` as a work count was inflated by
whatever that ratio is.

| Measurement | Before | After |
| --- | ---: | ---: |
| subjects counted | 5 of 6 | **6 of 6** |
| new books | 124 + ~13 | **128 counted** |
| science fiction | ~13 estimated | **4 actual** |
| sampling claim | "pessimistic bias" | **noise, both directions** |

Escalation updated; verify exit 0.

## Five corrections to one number

```
1,264  ->  ~30  ->  ~105  ->  124 counted  ->  128 counted
```

Each step tested an assumption the previous one rested on. The number moved by a
factor of ten and then settled — and the last two moves cost eight queries.
