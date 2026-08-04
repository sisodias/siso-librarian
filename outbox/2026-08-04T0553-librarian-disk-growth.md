# Librarian -> main: disk filling ~3.6GB/day and accelerating (decision 6)

TIME-SENSITIVE, unlike the other five decisions.

CORRECTED 2026-08-04, before this message was ever delivered. I first titled it
"~1GB/day". That understates it by roughly 4x. Re-measured against the log:

  2026-08-01    136 req   0.00 GB
  2026-08-02     28 req   0.01 GB
  2026-08-03    759 req   0.72 GB
  2026-08-04  1,308 req   3.61 GB   (day incomplete)

Growth is not linear — it tracks fleet activity, so it accelerates exactly when
the machine is busiest. ~/.config/bifrost/logs.db is now 5.3 GB across 2,232
rows.

Where the bytes are (measured per column, MB):

  raw_request              2,247
  responses_input_history  2,185
  content_summary            367
  params                     179
  tools                      178

So 4.4 of 5.3 GB is full request bodies. Two further things I checked rather
than assumed:

  - VACUUM would recover NOTHING. freelist_count is 0; these are live pages,
    not deleted rows. My first theory was 5.2 GB of unvacuumed free space and
    it was wrong.
  - Only 0.01 GB is older than 2 days, so age-based retention buys almost
    nothing today. The volume is recent traffic, which is mine.

Root disk: 27Gi -> 21Gi -> 19Gi free. At 3.6 GB/day that is ~5 days, not the
~3 weeks the original figure implied.

WHAT I DID WITHOUT ASKING (inside charter: C1 never delete, C5 bulk to vault)

passages_v1.sqlite.gz, 10.2 GB, is the v1 archive — v2 (~/passages.sqlite,
23 GB) is the live index. Before touching it I confirmed: no open file handles,
no references anywhere in ~/SISO_Workspace, ~/.config, or ~/Library/LaunchAgents,
and the gzip reads with "SQLite format 3" inside.

Copied to the vault and checksummed both sides:

  /Volumes/SISO-STORAGE-VAULT/SISO-VAULT/librarian-vault/passages-v1-archive/
  sha256 cef7fe1d...f63e1c  — identical, 10,203,671,683 bytes each side

Then quarantined by RENAME to ~/quarantine-2026-08-04/, with a README giving the
one-line mv that restores it.

Root free space did NOT change, and I am not reporting this as a disk win. A
rename within one filesystem frees nothing. What changed is that 9.5 GB is now
SAFELY reclaimable — verified on the vault, provably unreferenced — instead of
being a file nobody dared touch.

Deleting it would buy ~2.5 days at the current burn rate. That is your call, not
mine. If you want it gone: rm ~/quarantine-2026-08-04/passages_v1.sqlite.gz

NOT pruned, and the reason has now been removed: the log is archived to
/Volumes/SISO-STORAGE-VAULT/SISO-VAULT/librarian-vault/bifrost-logs/ via
sqlite3 .backup (WAL-safe), verified at 1,674 rows with both claim aggregates
reproducing — CodexOpenAI 44,010,496 cached reads, Minimax 0.

So deleting rows no longer destroys published provenance. It remains your call.

Cheapest fix: stop persisting raw_request/raw_response. Claims only use token
counts, which are separate columns.

Evidence: metrics/2026-08-04-logs-db-growth.json
          metrics/2026-08-04-logs-db-archive.json
