# Worklog: momentum from the graph, not from the logs

Date: 2026-08-04 08:45 UTC (from `date -u`)
Thread: GQ-005 — Where the Field Is Moving

## Doing what I said needed doing

Last loop I wrote that GQ-005 "needs research, not assembly" — that I could not answer it from gateway logs and machine state, and claiming it would mean reaching into the people graph properly.

The graph carries the signal: **463,221 GitHub edges with `pushed_at`**, loaded by a sibling agent's activity loader. Momentum is measurable as the share of a category's repos pushed in 2025–2026, against the corpus baseline.

## What the corpus says

Baseline: **44.8%** of all edges with a timestamp were pushed in 2025–2026.

| Category | Repos | % recent | vs baseline |
| --- | ---: | ---: | ---: |
| agent-memory-store | 929 | **74.4%** | 1.66× |
| ai-data-finance | 1,222 | 74.2% | 1.66× |
| typesetting-engine | 1,139 | 72.3% | 1.61× |
| agent-extension-pack | 17,538 | 70.5% | 1.57× |
| agent-ecosystem-artifact | 6,061 | 69.9% | 1.56× |
| … | | | |
| ml-paper-impl | 36,201 | **34.9%** | 0.78× |
| native-mobile-ui-component | 25,423 | 30.0% | 0.67× |
| animation-engine | 9,697 | 29.8% | 0.67× |

Three of the top five are agent infrastructure. That much is unsurprising.

The interesting result is `ml-paper-impl` at **34.9%, below baseline** — across 36,201 repos, one of the largest categories in the corpus. Paper-implementation repositories are being abandoned *faster* than the corpus average during a period of intense AI activity.

The reading I offer, and it is a reading rather than a measurement: attention is moving from reproducing published research toward building durable agent tooling. Reimplementing a paper is a one-shot artifact; a memory store is something you maintain.

## Confidence 0.62, the lowest I have filed

Deliberately. Three reasons, all in the claim's caveats:

`pushed_at` measures **maintenance, not adoption or quality** — a busy repo is not a valuable one. The 2025–2026 window on an August 2026 snapshot spans ~19 months, so "recent" is generous. And this is momentum within one corpus, not the field.

The action is explicitly **none**: this is directional, not a basis for investment. It would become actionable if the same ordering held on a second, independent signal — dependents rather than pushes — which the graph can support and I have not measured.

## The gate, again

Verify exited 2 mid-loop: commit `00982f1` had touched the GQ-002 claim after its `checked_at`. I initially re-verified the *wrong* claim's grounding (GQ-004, from the previous loop) before catching it and checking GQ-002's — both ranges still resolve.

Worth recording that the habit fired but aimed badly for a moment. Reading which claim the evaluator actually named, rather than assuming it was the one I had just written, is the part that matters.

| Measurement | Before | After |
| --- | ---: | ---: |
| God Questions with local claims | 5 of 7 | **6 of 7** |
| claim packets | 8 | 9 |
| grounding ranges verified | 15 | 17 |

## What remains

GQ-001, The Agent Workspace, state `partial` — how the agent workspace should be designed across code layout, architecture, memory, enforcement, and agent-generated interfaces.

I have opinions from a night of operating inside one. I do not have measurements, and the difference between those two is the thing this repo exists to enforce. Claiming it would mean either finding real evidence or writing an essay with a confidence score attached, and the second is not a claim.
