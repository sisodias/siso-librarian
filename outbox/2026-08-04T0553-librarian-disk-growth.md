# Librarian -> main: disk filling ~1GB/day (decision 6)

TIME-SENSITIVE, unlike the other five decisions.

~/.config/bifrost/logs.db went 205MB -> 3.4GB in one session. Only 1,674 rows,
but Bifrost persists full raw request/response bodies — ~945KB per request. My
own large-context traffic caused it.

  2026-08-03  759 req   501 MB
  2026-08-04  740 req   997 MB  (half day)

Root disk 27Gi -> 21Gi free tonight. ~3 weeks headroom at this rate.

NOT pruned, and the reason has now been removed: the log is archived to
/Volumes/SISO-STORAGE-VAULT/SISO-VAULT/librarian-vault/bifrost-logs/ via
sqlite3 .backup (WAL-safe), verified at 1,674 rows with both claim aggregates
reproducing — CodexOpenAI 44,010,496 cached reads, Minimax 0.

So deleting rows no longer destroys published provenance. It remains your call.

Cheapest fix: stop persisting raw_request/raw_response. Claims only use token
counts, which are separate columns.

Evidence: metrics/2026-08-04-logs-db-growth.json
          metrics/2026-08-04-logs-db-archive.json
