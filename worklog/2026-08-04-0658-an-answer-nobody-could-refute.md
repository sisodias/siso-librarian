# Worklog: an answer nobody could refute

Date: 2026-08-04T06:58:10Z (generated filename)
Thread: testable contracts — 1 of 7 was the largest structural gap

## What was wrong

GQ-002 "10x the Agent Layer" was marked **`state: answered`** with **zero
falsifiers**, zero success criteria, zero watch triggers, and
`decision_to_change: None`.

Its own `answer_shape` demands "a ranked leverage map whose recommendations each
carry measurements, external analogues, an experiment, and **a falsifiable
success threshold**." It was declared answered while carrying nothing that could
make it wrong. That is the precise failure GQ-009 exists to prevent, sitting in
the registry the whole time.

## What I wrote

Four success criteria, four falsifiers, four watch triggers, three evidence
gaps — all grounded in measurements already on disk, not in language that merely
sounds rigorous. The falsifiers name numbers:

- top-ranked lever, once applied, yields **< 2x** on the metric it was ranked by
- ranking **reorders its top three** when re-derived a week later (described a
  moment, not a structure)
- gains dominated by one provider, so "agent layer" is the wrong framing
- bottleneck turns out to be **human review latency**, in which case no agent-layer
  change reaches 10x

Watch triggers fire on things that actually move: a cached-read rate shifting
>20 points, a new provider on the gateway, any recommendation being applied, or
volume falling below the **100-request floor** I documented after a 4-request
CodexProxy outlier nearly became a headline.

## The finding that came out of writing them

Success criterion 4 requires at least one lever **applied and re-measured**.
Evidence gap 1 records the truth: `scripts/minimax-cache-route.sh` is written and
tested but **NOT APPLIED**, awaiting Shaan. So the largest predicted gain on the
whole map is unverified.

An answered question cannot have an unmet success criterion. I downgraded
`answered` -> `partial` and recorded why in `state_note`.

**Writing the falsifiers is what exposed the gap.** Nothing else this session
would have caught it, because with an empty contract there was nothing to check
the state against — the gate computing "testable contracts" counted array
lengths and had no opinion about a question that declared victory with empty
arrays.

I also filled `decision_to_change`, which was `None`: where to spend the next
unit of agent-layer effort — fixing an existing path's economics versus
substituting a model or harness. The measured evidence already favours the
former (Minimax 0% cached across 143 requests vs CodexOpenAI 97.2%).

| Measurement | Before | After |
| --- | ---: | ---: |
| Testable contracts | 1 of 7 | **2 of 7** |
| GQ-002 falsifiers | 0 | 4 |
| GQ-002 state | answered | partial (justified) |
| GQ-002 evidence gaps recorded | 0 | 3 |

Registry pushed as `5a2d89a` to great-library-of-siso.

## Residual

Five questions still carry empty contracts. I did GQ-002 first because
`answered` + zero falsifiers is a live contradiction rather than a mere absence;
the other five are honestly-scoped or partial, so an empty contract understates
them rather than overstating them.
