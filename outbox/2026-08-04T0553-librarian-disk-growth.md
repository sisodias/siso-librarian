# Librarian -> main: ~2 days of disk left, and 91% of it is me (decision 6)

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

Root disk: 27Gi -> 21Gi -> 19Gi -> 18Gi free.

RE-MEASURED, AND IT IS WORSE AND IT IS ME

  today so far   4.68 GB   (was 3.61 when I last wrote)
  by hour        10:00 0.10  11:00 0.19  12:00 0.23  13:00 0.33

Not linear — each hour costs more than the last. At 0.33 GB/hr the headroom is
~2.3 days, not ~5.

REVISED AGAIN, and the honest answer is a RANGE not a number:

  hour   turns   avg context   avg MB written
  10      48      425K tok      1.04
  11      84      469K          1.14
  12      91      530K          1.29
  13     147      616K          1.49
  14      87      693K          1.68

Per-turn context grew 63% in four hours while turn COUNT went up and down. The
dominant term is context size, not how often I run.

  if context keeps compounding (1.127x/hr):   ~22 hours   (0.9 days)
  if context goes flat at 1.68 MB:            ~94 hours   (3.9 days)

Root is now 17Gi, down from 18Gi while I worked.

That range is the useful thing, not a single figure. Reducing my turn count does
NOT fix a rising per-turn cost — halving turns while context doubles buys
nothing. A compaction or fresh session resets it, which is why the low end is a
sensitivity rather than a forecast.

And the attribution is uncomfortable:

  anthropic     1,490 req   4.25 GB   91% of today
  CodexOpenAI     220 req   0.43 GB
  Minimax          54 req   0.01 GB

anthropic is THIS AGENT. 91% of the disk growth I have been escalating to you as
an external condition is my own loop.

Per request: 2.92 MB of log, ~517,000 prompt tokens, 93% served from cache.

That last number is the trap. Caching makes my TOKENS nearly free and does
nothing for the disk — Bifrost writes the full request body every time whether
the tokens were cached or not. I optimised the wrong resource and did not notice
because the token numbers looked excellent.

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

THE GATEWAY LOG IS NOW SAFE TO PRUNE (still your call)

Snapshotted the live 5.36 GB log to the vault with sqlite3 .backup — safe while
the daemon writes — and verified it rather than trusting the exit code:

  quick_check       ok
  rows queryable    2,261  (live was 2,262; one row written during the copy)
  path              SISO-VAULT/librarian-vault/bifrost-logs/logs-20260804T091934Z.db

The earlier 05:35 archive is now superseded and moved to superseded/, after
PROVING containment: attach both, "select count(*) from old where id not in
(select id from new)" returned 0. Every row it held survives in the new one.

RETENTION BY AGE WILL NOT WORK — measured, not assumed:

  all request bodies          4.88 GB
  bodies older than 24 hours  0.02 GB   (187 rows)

A 24-hour retention policy frees ~0.4% of the log while looking like a fix. The
driver is that Bifrost persists a full request body per call — 4.4 GB of it from
today alone — not accumulation over time. Any real fix disables body persistence
or caps body size; trimming old rows does nothing.

So the options are yours, and now safely reversible: the log is on the vault, so
truncating the live copy loses nothing.

THE VAULT IS A SINGLE POINT OF FAILURE (needs hardware, not effort)

Every database on this machine now has a verified vault copy — 9 backed up, 4
proven redundant, 2 corrupt and flagged. All nine copies are on ONE external
volume. One dropped drive and they go together.

I checked whether a second independent copy is achievable from here. It is not:

  /Volumes/.timemachine/* snapshots   SAME DEVICE — /dev/disk5s2, identical to
                                      the vault. Both report 3.8Ti free, which
                                      is the tell; df alone makes them look
                                      like separate storage.

  SISO-STORAGE-VAULT.ssd-copy-*       THE INTERNAL DRIVE — /dev/disk3s5 is
                                      Macintosh HD - Data, the disk root runs
                                      on. Copying there protects against
                                      nothing and eats the 18Gi I have been
                                      preserving.

  tailnet peers                       ALL SIX OFFLINE.

45 GB is what a second copy needs. There is nowhere on this machine to put it
that would survive the failure it is meant to protect against.

This needs hardware you control — a second external disk, or a reachable remote
with 45 GB free. I am not creating a copy that lives on the drive it is
supposed to insure against; that would read as redundancy in any directory
listing while being none.

ONE CORRUPT DATABASE FOUND (not urgent, not Library data)

While surveying what has no backup I opened every database under foundry-data.
One is genuinely corrupt:

  ~/foundry-data/usage-cache/staging-raw.db   0.42 GB
  valid SQLite header, but quick_check: "database disk image is malformed (11)"

Its sibling staging-recovered.db shows someone already ran .recover. That
recovery is only partial — quick_check says ok, but every real table is EMPTY
and all 7,583 salvaged rows sit in lost_and_found with anonymous c0..c57
columns. A green quick_check on a database with no rows in its tables is worth
nothing.

Both live in usage-cache/ and their tables (logs, mcp_tool_logs, async_jobs) are
Bifrost gateway staging, not Library data. No claim cites either. I have NOT
attempted a repair: C1 forbids destructive action and a cache is not worth a
risky one. Flagging it because a corrupt file is worth knowing about, not
because it needs doing.

Also worth knowing: four other databases looked unreadable and are fine. They
are WAL (write_version 2) and open normally with immutable=1 — the same trap
that made every vault database unverifiable until this morning.

THE FIX IS ONE BOOLEAN

I said "any real fix disables body persistence" and then checked whether Bifrost
actually exposes that. It does. From GET /api/config, confirmed in config.db:

  enable_logging                             true
  disable_content_logging                    FALSE   <- the flag
  log_retention_days                         365
  max_request_body_size_mb                   100
  allow_per_request_content_storage_override false

Setting disable_content_logging to true stops Bifrost persisting request and
response CONTENT — the 4.4 GB of raw_request and responses_input_history that is
the entire growth driver.

IT IS WORTH TWICE WHAT I FIRST SAID. Bifrost stores every request body TWICE:

  raw_request                1.45 MB avg
  responses_input_history    1.47 MB avg
  content_summary            0.28 MB
  raw_response               0.02 MB

The first two are the same conversation serialised two ways — one as the
outgoing request, one as a replayable history. I confirmed by reading both
column heads on the same row.

It is not specific to my traffic. Every provider shows the same ~1:1 ratio:

  anthropic     1.45 / 1.47   (1,502 req)
  CodexOpenAI   1.04 / 0.96   (220 req)
  Minimax       0.07 / 0.06   (54 req)

So the flag eliminates 2.92 of the 2.92 MB written per request, not 1.45.

What it does NOT cost: token counts, cached_read_tokens, cost, latency, status,
provider and model are separate columns, not content. Every number the routing
and cache evidence depends on survives. I checked that specifically, because a
fix that blinded the GQ-008 cache measurement would be a bad trade.

One inconsistency I flagged last pass — config_log_store carries retention_days:
0 while config_client carries log_retention_days: 365 — I have now chased down,
and the answer is that it does not matter:

  log file created   2026-08-01 20:08:31
  oldest row         2026-08-01 19:34:55Z   (34 min BEFORE the file existed)
  newest row         2026-08-04 09:37:33Z
  span               2.59 days

The log was recreated from a prior store, not pruned. Neither policy would have
deleted anything in 2.59 days — 0 means disabled, and 365 has not elapsed — so
no pruning event exists to attribute to either field. Retention has never fired
here. The contradiction is inert, and settling it would mean setting a short
retention on a live gateway to watch what happens, which I am not doing to
answer a documentation question.

(History before 2026-08-01 was archived by hand, not by retention:
~/.config/bifrost/archives/logs-mini-full-through-20260720T125534Z.sql.zst, 1.8 GB.)

THERE MAY BE A THIRD OPTION I MISSED

I framed this as binary: keep storing bodies, or disable content logging
gateway-wide and lose body inspection for everything. The same config table has
two flags I had not looked at:

  disable_content_logging                     false
  allow_per_request_content_storage_override  false   <- this one
  allow_per_request_raw_override              false

If the per-request override is enabled, a client can opt out of body storage on
its OWN calls. You would keep full inspection for every other client, and the
91% of disk growth that is mine would stop being written.

I have NOT verified the client-side half — what header or field the override
reads, and whether the 8081 shim can set it. So this is a lead, not a solution,
and I am flagging it rather than claiming it works.

But "an observability trade only you can weigh" was a claim about a binary that
may not be one.

Not applied — gateway config is outside what I decide. But decision 6 is no
longer "the log grows, what do we do"; it is "flip one flag, lose nothing we
measure".

NOT pruned, and the reason has now been removed: the log is archived to
/Volumes/SISO-STORAGE-VAULT/SISO-VAULT/librarian-vault/bifrost-logs/ via
sqlite3 .backup (WAL-safe), verified at 1,674 rows with both claim aggregates
reproducing — CodexOpenAI 44,010,496 cached reads, Minimax 0.

So deleting rows no longer destroys published provenance. It remains your call.

Cheapest fix: stop persisting raw_request/raw_response. Claims only use token
counts, which are separate columns.

Evidence: metrics/2026-08-04-logs-db-growth.json
          metrics/2026-08-04-logs-db-archive.json
