# Worklog: the rights filter rejected 86% of a want-list, and it was right to

The eighth want-list yielded **476 eligible of 3,409** — a 14% pass rate against
51% on the seventh. Nearly three thousand books excluded is worth understanding
before accepting.

## Where the exclusions are

```
bare-assertion        2,761   excluded
none                    172   excluded
formal-designation      376   admitted
institutional-review    100   admitted
```

One grade accounts for 81% of the list.

## My hypothesis, and why it was wrong

I expected `bare-assertion` to hold **old** books — items whose age makes them
unambiguously public domain regardless of how the metadata is worded, rejected by
a filter too literal to notice. That would have been a real defect.

Measured: of 2,761 bare-assertion items, **fifteen** were published before 1900.
Forty-two before 1929.

What they actually are:

```
2000s   595
1990s   728
1980s   313
1970s   526
1960s   455
```

Modern engineering and physics texts, where a plain `"Public Domain"` string in
IA metadata is **exactly** the unverified assertion this filter exists to catch.

## Why the pass rate fell

| list | subjects | items from the 2000s |
| --- | --- | ---: |
| seventh | Zoology, Medicine, Agriculture, Astronomy | 96 |
| eighth | Physics, Mathematics, Engineering, Philosophy | **595** |

Six times as much modern material. **The pass rate tracks the era of the subject,
not a change in the filter.**

## Verdict: no change

The 14% is the filter working. I am recording this as a verified negative result
so that the next time a pass rate drops I check the decade distribution first
rather than re-deriving this from scratch.

**What would change my mind:** a `bare-assertion` bucket dominated by pre-1929
material, where age settles the question independently of metadata wording.
