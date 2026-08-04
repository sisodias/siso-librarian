# Proposal: create verified vault backup of passage index

Date: 2026-08-03
Thread: Passage index single-copy risk

## Gap

`~/passages.sqlite` is a 23G passage index on the internal SSD. The charter ranks this as a top gap: one local copy means a drive failure loses 41.5M passage locators. The live DB should not be moved or mutated, but it needs a verified vault copy.

This beats building new passage features because the existing index is already valuable and not yet durable.

## Evidence before action

Measured before backup:

- `/`: 24Gi available, 42% capacity
- vault: 3.8Ti available
- load averages: 1.37 / 1.27 / 1.25
- `~/passages.sqlite`: 23G, mtime 2026-08-03 18:37
- known measured content from earlier successful query: 41,501,325 passages, 77,540 books

A full `sqlite3` count/quick_check over the live DB exceeded the interactive timeout, so the backup process must verify by file bytes and SHA-256 first, then run heavier SQLite checks on the copied artifact separately if time allows.

## Proposal

1. Copy `~/passages.sqlite` to `/Volumes/SISO-STORAGE-VAULT/SISO-VAULT/librarian-vault/passage-index/` with `rsync --partial --inplace`.
2. Record source and destination size.
3. Compute SHA-256 for source and destination.
4. Record a manifest in the librarian repo.
5. Do not delete or move the live DB.

## Measurement expected to move

- verified vault copies of passage index: 0 -> 1
- bytes protected on vault: 0 -> ~23G
- source SHA-256 recorded: no -> yes
- destination SHA-256 recorded: no -> yes
- live DB moved/deleted: no -> no

## Non-goals

- Do not mutate `~/passages.sqlite`.
- Do not run SQLite writes on the vault copy.
- Do not delete the internal copy.
- Do not publish the passage index in this loop.
