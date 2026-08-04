# Worklog: the refresh ledger was asserting freshness, not checking it

Date: 2026-08-04 01:00
Thread: GQ-009 — "continuously updated"

## The gap

GQ-009 asks how the Library keeps questions *continuously updated*. The refresh ledger was built to answer that, and on paper it did: one entry, three declared `invalidate_on` triggers, `result: "fresh"`.

But that result was a hand-written assertion. Someone decided the claim was fresh and typed the word. Nothing ever evaluated the triggers. A ledger whose freshness is asserted rather than derived is a note, not a refresh mechanism — and it is worse than nothing, because it *looks* like coverage.

So I evaluated the triggers against actual repository state.

## What the check found

All three fired since the recorded check at `2026-08-03T00:00:00Z`:

| Trigger | Fired | Evidence |
| --- | --- | --- |
| schema change | yes | 5 commits touching `schemas/` and the verifier (`a8cdca2`, `3aa3db1`, `5a7b07b`, `0330b8f`, `634dd3e`) |
| new evidence source | yes | 2 commits adding then revising the Internet Archive adapter contract |
| approved action status change | yes | 1 commit (`0330b8f`) |

The ledger said `fresh`. Reality said `stale`. It had been drifting for a day and the registry could not see it, because the only thing watching was a sentence.

Corrected the ledger to `stale` with the evidence inline. Worth being precise about what is stale: the claim's *position* — that the Library needs a packet binding question to evidence, confidence, refresh and action — is not contradicted. Its **grounding** is, because that grounding predates the entire source-adapter layer.

## What changed

`scripts/evaluate-refresh.mjs` maps each declared trigger to the repo paths whose commits would fire it, checks `git log` since `checked_at`, and derives freshness rather than reading it. It exits non-zero on disagreement, and it is now part of `npm run verify`, so drift is caught every loop instead of whenever someone remembers.

Unmapped triggers report as `unevaluatable` rather than passing silently. A trigger nobody can check is more dangerous than no trigger, since it reads as covered.

## The bug I introduced and caught

My first version was wrong in an interesting way. After correcting the ledger to `stale`, I moved `checked_at` to now — so no commits fell in the window, the evaluator derived `fresh`, and it flagged a disagreement against my own correction.

The flaw was conflating two different questions: *have new triggers fired since the last check* and *is this claim's grounding current*. A claim can be knowingly stale while no new triggers have fired since you wrote that down. Treating acknowledged debt as a failure would make the gate cry wolf until someone refreshed the grounding — and a gate that always screams gets switched off, which would have quietly cost more than the drift it was built to catch.

Now an entry already recorded `stale` or `blocked` passes as acknowledged debt, while an entry claiming `fresh` with fired triggers still fails hard.

I verified both directions rather than assuming: real ledger exits 0 with `acknowledged_debt: true`, and a deliberately falsified `fresh` entry restored to the old timestamp still exits 2. The falsified ledger was written to `/tmp` and the real one restored and confirmed afterwards.

## Honest residual

This makes freshness *detected*, not *maintained*. The claim is now correctly marked stale, and it stays stale until its grounding is rebuilt against the current source layer — which is real work, not a status flip. The value delivered here is that the registry can no longer silently believe something it has not checked.

The trigger-to-path map is also deliberately literal. It handles the three phrases in use; a new trigger phrase reports `unevaluatable` until mapped, which is the correct failure direction.
