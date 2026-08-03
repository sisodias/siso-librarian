# Proposal: promote awesome-list signal to canonical people graph

Date: 2026-08-03
Thread: Awesome-list signal / people graph

## Gap

The full awesome-list catalog is present on the mini and staging proved that `load_awesome_signal.py` cleanly updates a copy of the real people graph. Canonical `people_v2.sqlite` still has only the older awesome signal: 53,072 curated owners and 64,411 edges with `list_count`.

Promoting the staged result makes the graph answer "who is independently cited by curated lists?" against the current catalog, not the stale partial load.

## Evidence before action

Machine health before write:

- `/`: 25Gi available
- vault: 3.8Ti available
- load averages: 1.26 / 1.19 / 1.22

Canonical graph baseline:

- DB: `~/foundry-data/domains/people/people_v2.sqlite`, 1.1G
- `pragma integrity_check`: ok
- `person_topic_total`: 2,517,910
- `curated_awesome` (`scheme='curated', topic='awesome-cited'`): 53,072
- edges with `list_count`: 64,411

Staging result on copy:

- `person_topic_total`: 2,555,047
- curated awesome owners: 90,209
- edges with `list_count`: 119,898
- second apply: idempotent
- integrity check: ok

## Proposal

1. Copy canonical graph to a timestamped backup on internal SSD.
2. Verify backup integrity before applying.
3. Run `load_awesome_signal.py --apply` against canonical graph.
4. Run integrity check after apply.
5. Rerun loader once for idempotency.
6. Record exact before/after deltas and backup path.

## Measurement expected to move

- curated awesome owners: 53,072 -> 90,209
- edges with `list_count`: 64,411 -> 119,898
- `person_topic_total`: 2,517,910 -> 2,555,047
- canonical integrity: ok before and after
- idempotent second apply: yes

## Non-goals

- Do not touch stale `/tmp/people_v2_gh.sqlite`.
- Do not run unrelated graph-enrich loaders.
- Do not delete backups.
