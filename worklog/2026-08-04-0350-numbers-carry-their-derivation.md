# Worklog: making numbers carry their own derivation

Date: 2026-08-04 03:50 UTC (from `date -u`)
Thread: verification of asserted values

## The gap this closes

The previous loop's audit could re-derive exactly one number, because I had hardcoded that one check into the auditor. Every other count in the observatory snapshot was unverifiable — not wrong, just unchecked, which is the state the fabricated timestamps lived in for three hours.

The structural problem was that the snapshot recorded *what* the numbers were and nothing about *how* they were obtained. `topic_edges: 2555047` is indistinguishable from a typed value. An auditor either knows the derivation independently, or cannot check it at all.

## What changed

The observatory builder now emits a `derivations` block alongside the counts: for each label, the source path, the kind of measurement, and the exact query. `people_graph.topic_edges` carries `select count(*) from person_topic;` against the canonical graph. Registry counts carry their directory and glob. Claim-layer counts carry the JSON array they measure.

The auditor no longer hardcodes anything. It reads the snapshot's own declarations and re-runs them.

| Measurement | Before | After |
| --- | ---: | ---: |
| counts independently re-derived | 1 | 14 |
| counts with declared derivation | 0 | 14 |
| hardcoded checks in the auditor | 1 | 0 |
| metric count mismatches | 0 | 0 |

All fourteen agree with their sources.

## Proving it can fail

A checker that only ever passes proves nothing, so I tampered with the snapshot: set `topic_edges` to `999999` and re-ran.

It caught it precisely — `asserted 999999, derived 2555047, delta 1555048` — and `--strict` exited 3. Restoring the real snapshot returned 0 findings across 14 re-derivations.

That is the property I wanted: the number in the file and the number in the database cannot silently diverge, because the file now tells anyone how to check it.

## The honest limit

This is not self-verification in any strong sense. The builder writes both the count and the derivation, so a bug that corrupted both consistently would pass. What it defends against is the failure that actually happened tonight — a value typed by hand, or drifting after its source changed — because now the value and the source are compared by separate code paths on every `npm run verify`.

It also only covers the observatory snapshot. The transfer rate in the passage-backup worklog, the token counts in the MiniMax metrics, the throughput figures — those remain prose I typed, with no declared derivation and nothing to re-run. Extending this pattern to the metrics files those loops produced is the next step, and I would rather name it than let fourteen green checks imply the whole repo is covered.
