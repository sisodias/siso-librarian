# Worklog: GQ-001 v2 — the gates became an enforcement boundary, and showed their blind spot

Five fixes today shared one root. That is a claim, not five worklogs.

## What v1 said, and what falsified it

GQ-001 v1's central measured limit:

> the gates have blocked **ZERO** pushes … a pre-commit convention rather than an
> enforcement boundary

That no longer holds. Today the pre-push hook **refused an actual push**,
correctly, on a genuine 200-book gap between the corpus index and the texts on
disk. First real enforcement event.

Every count in v1 has moved too: **6 gates → 11**, **14 self-test cases → 15**,
**2 probes → 8**.

## The sharper finding: what enforcement still cannot see

All five defects had the same shape — the input was **absent**, not **wrong**,
and each checker answered as though absent meant fine.

```
mktemp failed      -> LOGFILE empty -> OCR-skip branch unreachable -> exit 9 on a correct corpus
"not a database"   -> counts empty  -> "rows total: unknown" then "nothing to do", exit 0
empty sources/     -> checked_files 0 -> findings [], exit 0
```

Every self-test case broke artifacts by making them **wrong**. Not one removed an
input. **All five would have passed the suite.**

And worse: six probes printed PASS/FAIL **into a void**. Forcing a FAIL still
gave `15 passed, 0 failed`, exit 0 — the probes are subshells and the counters
lived only in `check()`.

So the limit is not v1's "gates miss what only execution finds". It is that **a
gate's input is unguarded**: a checker proves nothing about its own
reachability, and a verdict nobody counts is indistinguishable from a pass.

## Writing it required four corrections of my own

- read `position` at the top level — it is nested under `claim`
- 8 schema errors; the summary prints only the count, so I re-used the
  verifier's own `validate()` rather than reimplement it: bad id prefix,
  `supersedes` must be an array, `kind` must be `external`, one quote under 12 bytes
- a `grep` for the disagreement printed **other** entries — a probe proving nothing
- **the honest one:** my three `invalidate_on` triggers were not in
  `TRIGGER_PATHS`, so `evaluate-refresh` derived **`unknown`** against my
  recorded `fresh`. It refuses to certify freshness it cannot check.

I registered the triggers rather than delete them from the claim — deleting
would have bought a green gate by asking it less.

| | derived |
| --- | --- |
| as written (claim postdates the edits) | **fresh**, agrees, 0 unevaluatable |
| `checked_at` backdated to 2026-08-01 | **stale** — all 3 fire (41, 20, 3 commits) |

Confidence **0.81**. `npm run verify` exits 0.
