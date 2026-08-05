# Worklog: my new gate broke the suite that proves gates are load-bearing

The hook refused the push — **second real enforcement event today**, and again it
was right.

```
BASELINE FAILED — the chain does not pass on a clean copy; results would be meaningless
```

## The cause

The load-bearing suite runs the chain on a scratch copy with exactly **one
synthetic commit**. So every worklog's add-commit is "just now", and the 44
worklogs written today each showed hours of drift. My new `--strict` gate fired
**44 times on a repo with no defect at all**.

## Why the gate should change, not the suite

The suite already **excludes** `evaluate-refresh` for exactly this reason. I
could have added a second exclusion — but an exclusion list is a thing callers
forget, and I had just forgotten it. Better for the gate to detect synthetic
history itself and stay load-bearing everywhere it can be.

One commit is the signature; real history here is in the thousands. The check is
**skipped and says so** as an info finding, rather than passing silently — a skip
that looks like a pass is the defect I spent today removing.

## A second defect the first fix exposed

Two `declared-derivation` findings dated **2026-08-04** still gated. They carry:

```
file: "metrics/2026-08-04-gq001-workspace-enforcement.json"
path: "session.commits"        <- a JSON POINTER, not a filesystem path
```

My `isHistorical` read `path` first, found no date, and classified 08-04 findings
as new work. Same wrong-key shape that `lib/claim-paths.mjs` and
`lib/snapshot-paths.mjs` were built for: two fields, similar names, different
meanings.

## Verified four ways

| case | result |
| --- | --- |
| real repo | **exit 0** — 25 historical findings reported, not gated |
| synthetic-history copy | **exit 0** — was 44 gating findings |
| fabricated timestamp on real history | **exit 3** — still catches it |
| full suites | **5 pass, 0 fail**; 9 load-bearing, 0 not |

The third row is the one that matters: two rounds of widening, and the gate still
fires on the thing it was written for.
