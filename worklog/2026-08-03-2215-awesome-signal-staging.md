# Worklog: awesome-list signal staging on real graph

Date: 2026-08-03 22:15
Thread: Awesome-list signal / people graph
Proposal: `proposals/2026-08-03-awesome-signal-staging.md`

## What changed

Staged the awesome-list signal reload against a copy of the real people graph. Canonical graph was not mutated.

Added:

- `proposals/2026-08-03-awesome-signal-staging.md`
- `metrics/2026-08-03-awesome-signal-staging.json`
- this worklog

## Before / after numbers

Catalog now present on the mini:

| Measurement | Count |
| --- | ---: |
| `catalog_full.sqlite` size | 437M |
| `entry` rows | 652,851 |
| `repo` rows | 307,180 |
| `owner_signal` rows | 179,370 |

Dry-run against real graph:

| Measurement | Count |
| --- | ---: |
| owner signal rows after fold/filter | 177,123 |
| matched owners | 90,208 |
| unmatched owners | 86,915 |
| edges matched | 119,654 |
| edges owner missing | 187,526 |

Staged apply to `/tmp/people_v2_awesome_20260803T210710Z.sqlite`:

| Measurement | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `person_topic` total | 2,517,910 | 2,555,047 | +37,137 |
| curated awesome owners | 53,072 | 90,209 | +37,137 |
| edges with `list_count` | 64,411 | 119,898 | +55,487 |

Verification:

- `sqlite3 <copy> 'pragma integrity_check'`: `ok`
- second `--apply` run: identical before/after counts, idempotent
- curated awesome semantics verified as `scheme='curated'`, `topic='awesome-cited'`

## What I got wrong / what surprised me

The handover said `catalog_full.sqlite` was ~143M and syncing. On the mini it is already present at 437M with 652,851 entries. The data grew or the handover estimate was stale.

My first independent verification query looked for `scheme='curated_awesome'`, which was wrong. The loader uses `scheme='curated'`, `topic='awesome-cited'`. I corrected the verification before recording the metric.

## Promotion status

Not promoted to canonical in this loop. The staged result is clean and idempotent, so canonical promotion is ready as a separate loop with backup, apply, integrity check, and measured mtime/count deltas.
