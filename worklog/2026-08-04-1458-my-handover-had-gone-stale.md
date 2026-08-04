# Worklog: my handover had gone stale

Date: 2026-08-04T14:58:38Z (generated filename)
Thread: the document a successor reads first

## The irony

`HANDOVER-NEXT.md` opens by warning that `HANDOVER.md` contains claims which are
now false. Six of its own rows had gone the same way:

```
"5 claims, 2 questions"           ->  7 live + 1 disputed + 2 superseded, 8 questions
"3 gates"                         ->  5 gates, 12 self-test cases
"Five decisions blocked"          ->  seven
"Testable contracts: 1 of 7"      ->  7 of 7, listed as work to do
passage index backed up           ->  9 databases, 4 proven redundant
cache "2,944/3,033"               ->  a value that varies with entry age
```

A successor reading it today would inherit **six wrong facts** and a to-do item
that is already done.

## Derived, not remembered

I did not retype these from memory. Each came from the snapshot or a live count:

```
claims live 7, disputed 1, superseded 2, portfolio questions 8
verify steps 6 (one is the observatory rebuild) -> 5 gates
selftest cases 12
registry God Questions 7
```

The row I would most easily have got wrong is the gate count — "6 steps" is what
`package.json` says, and one of those steps is the observatory build, not a gate.

## What I added

**"The thing that will bite you first"** — root at 17Gi, and the successor's own
loop is 91% of what fills it. With the trap stated plainly: a 93% cache hit rate
makes tokens nearly free and does **nothing** for disk, because the body is
written whether cached or not.

Plus the projection as a range (22 hours compounding vs 94 hours flat) and the
note that turn count is not the lever.

That is the single most expensive thing I learned today and it was nowhere in
the document someone inherits.

| Measurement | Before | After |
| --- | ---: | ---: |
| stale rows in the handover | **6** | 0 |
| completed items still listed as to-do | 1 | 0 |
| disk warning present | no | **yes** |

Verify exit 0.

## What I left alone

`HANDOVER.md`, again. It is an accurate record of what the laptop session knew
on 2026-08-03, and rewriting it would destroy the trail — the same reason I gave
for not touching it the first time.

Item 3 of "where I would go next" said *"do not build more verification
machinery, I over-invested there."* I then went from 3 gates to 5 with 12
self-test cases. Rather than delete my own advice I marked it as a standing
warning I did not take, which is more useful to a successor than a clean list.
