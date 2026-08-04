# Worklog: a number I could not honestly refresh

Date: 2026-08-04T14:38:22Z (generated filename)
Thread: the last self-referential claim

## The count I threw away

GQ-001 rests on *"3 defects caught by a gate, 6 only by running something"* —
hand-counted over one session, with 3 gates. There are now **5 gates**, **12
self-test cases** and **134 worklogs**.

I tried to refresh it mechanically:

```
gate-caught keywords       11
execution-caught keywords  13
```

Then I sampled the matches. `CAUGHT: ['npm run mailbox:flush']` is me
**demonstrating a gate fires on a deliberate fixture** — not a gate catching a
real defect.

**A keyword count over prose is the same shallow proxy** that ranked databases by
size, classified launchd jobs by `ProgramArguments[0]`, and matched
`people.sqlite` against `people_v2*`. Four times today.

So I discarded the ratio rather than publish 11-vs-13. The position now says
explicitly that no honest mechanical successor to the hand count exists.

## Two things I could measure

```
pushes blocked by verify                        0
defects the self-test found on its first run    1
```

**The gates have never blocked a push.** Not because they never fail — they have
— but because verify runs before every push by habit and I stop voluntarily.
It is a **pre-commit convention, not an enforcement boundary**. Nothing prevents
a push that skips it.

And a third category the original claim did not have: the self-test, on its
first run, found the refresh evaluator swallowing every git error and reporting
ten entries fresh from zero information. That is a defect found by a
**gate-checker**, which is neither a gate nor execution.

Confidence 0.58 -> **0.72** — up, because a claim that states its own
un-measurable parts is stronger than one asserting a stale ratio.

| Measurement | Before | After |
| --- | ---: | ---: |
| claims citing only their own metrics | 6 of 7 | **0 of 7** |
| claims with 2+ distinct sources | 1 | **6** |
| grounding ranges | 28 | **30** |
| declared derivations | 31 | **32** |

Verify exit 0; 30/30 grounding resolves.

## Six claims, six failure modes

```
GQ-010   under-evidenced      strengthened          0.68 -> 0.84
GQ-004   over-stated          provenance defect     0.83 -> 0.62
GQ-002   mechanism wrong      corrected             0.71 -> 0.79
GQ-006   arithmetic stale     confirmed, updated    0.79 -> 0.86
GQ-008   point observation    qualified, confirmed  0.86 -> 0.88
GQ-001   un-refreshable       count withdrawn       0.58 -> 0.72
```

Five of six moved up. Not because I was generous — because a claim tested against
its source can say precisely what it knows, and one citing its own summary cannot.

GQ-004 is the exception and the most useful result: its headline was someone
else's comment, and only going to the source revealed it.

## What this still is not

Independent review. All six re-derivations were done by the agent that wrote the
claims. A second party could find any of these queries wrong, and the seven
claims still have no reviewer — that part remains genuinely blocked on a person.
