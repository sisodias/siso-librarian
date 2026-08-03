# Worklog: awesome-list signal canonical promotion

Date: 2026-08-03 23:05
Thread: Awesome-list signal / people graph
Proposal: `proposals/2026-08-03-awesome-signal-canonical-promotion.md`

## What changed

Promoted the staged awesome-list signal reload into the canonical people graph at `~/foundry-data/domains/people/people_v2.sqlite`.

Also rebuilt the observatory snapshot/page so it reflects the new topic-edge count.

Added:

- `metrics/2026-08-03-awesome-signal-canonical-promotion.json`
- this worklog

Changed:

- `observatory/snapshot.json`
- `public/index.html`

Canonical DB backup created before write:

`/Users/shaansisodia/foundry-data/domains/people/_snapshots/people_v2.PRE-AWESOME-PROMOTE-20260803T220449Z.sqlite`

Backup integrity: `ok`.

## Before / after numbers

| Measurement | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `person_topic` total | 2,517,910 | 2,555,047 | +37,137 |
| curated awesome owners | 53,072 | 90,209 | +37,137 |
| edges with `list_count` | 64,411 | 119,898 | +55,487 |
| integrity check | ok | ok | — |

Loader apply summary:

| Measurement | Count |
| --- | ---: |
| owner signal rows | 177,123 |
| matched owners | 90,208 |
| unmatched owners | 86,915 |
| topic rows | 90,208 |
| edges matched | 119,654 |
| edges owner missing | 187,526 |
| first apply elapsed | 5.36s |

Idempotency:

- second `--apply` elapsed: 3.41s
- before and after counts identical
- idempotent: yes

## Verification

Commands/evidence:

- backup copy created before write
- `sqlite3 <backup> 'pragma integrity_check;'` -> `ok`
- `sqlite3 <canonical> 'pragma integrity_check;'` after apply -> `ok`
- second `load_awesome_signal.py --apply` produced no count changes
- `node scripts/build-observatory.mjs` rebuilt counts with `topic_edges: 2555047`
- `curl http://127.0.0.1:8765/` returned 4,139-byte HTML

## What I got wrong / what surprised me

The staged copy predicted the canonical result exactly. This was a good example of why staging against a copy is worth the extra step: canonical promotion became a short, verifiable operation rather than a risky graph mutation.

The loader reports `matched_owners: 90,208` but final curated awesome rows are 90,209. This off-by-one was already present in staging and appears to come from existing/folded row semantics. The durable measurement is the independent final SQL count: 90,209.
