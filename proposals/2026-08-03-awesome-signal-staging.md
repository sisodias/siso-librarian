# Proposal: stage awesome-list signal reload on real people graph

Date: 2026-08-03
Thread: Awesome-list signal / people graph

## Gap

`SOURCES.md` says the awesome-list harvest has only been loaded against a stale graph copy. The full catalog is now on the mini and larger than the handover note: 652,851 entries, 307,180 repos, and 179,370 owner rows. The real people graph is `~/foundry-data/domains/people/people_v2.sqlite`, but canonical DBs must not be written directly without a backup/promotion plan.

The next safe step is a staged apply against an internal SSD copy, with measured deltas and idempotency proof.

## Evidence before action

Measured catalog on mini:

- `catalog_full.sqlite`: 437M
- `entry`: 652,851
- `repo`: 307,180
- `owner_signal`: 179,370

Dry-run against real graph:

- owner_signal rows after folding/filtering: 177,123
- matched owners: 90,208
- unmatched owners: 86,915
- edges matched: 119,654
- before `person_topic_total`: 2,517,910
- before curated awesome owners: 53,072
- before edges with `list_count`: 64,411

## Proposal

Copy `~/foundry-data/domains/people/people_v2.sqlite` to `/tmp`, apply `load_awesome_signal.py` to the copy, rerun for idempotency, and record exact deltas. Do not mutate canonical graph in this loop.

If staging holds, the next loop can promote with backup + integrity check + observed canonical mtime/count changes.

## Measurement expected to move in staging

- curated awesome owners: 53,072 -> ~90,209
- edges with list_count: 64,411 -> ~119,898
- total person_topic: 2,517,910 -> ~2,555,047
- idempotent second run: yes

## What would prove this wrong

If the second apply changes counts again, the loader is not idempotent. If integrity_check fails on the copy, no promotion. If deltas duplicate graph-enrich work rather than replacing/updating existing signal, stop and inspect loader semantics.

## Non-goals

- Do not write canonical DB in this loop.
- Do not duplicate graph-enrich loaders.
- Do not use stale `/tmp/people_v2_gh.sqlite`.
