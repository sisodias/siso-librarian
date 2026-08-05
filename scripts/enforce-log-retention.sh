#!/usr/bin/env bash
# Enforce the bifrost log retention that the gateway setting does NOT enforce.
#
# WHY THIS EXISTS. On 2026-08-04 I set log_retention_days from 365 to 3 through
# the live API, verified the running process reported 3, and wrote that it
# "bounds future growth". Measured 2026-08-05, six hours later:
#
#   oldest row      2026-08-01, 3.15 days old — past the threshold, still there
#   rows over 3d    136, none evicted
#   page_count      2,300,871 -> 2,463,958 (grew)
#   freelist_count  0
#   Aug 4 payload   4.35 GB -> 4.74 GB
#
# The setting is live and nothing acts on it. A configured retention that never
# runs is worse than none, because it reads as solved. This is the safety net.
#
# WHAT IT DELETES. Rows in `logs` older than the window, and ONLY those. This is
# the one place in this repo that deletes data, so it is bounded three ways:
#   - it refuses unless the derivation slice on the vault verifies first, so the
#     numbers claims ground in survive the deletion
#   - it never deletes rows newer than the window, whatever the arithmetic says
#   - --dry-run is the default; deletion requires --apply
#
# C1 (never delete) is about DATA THE LIBRARY HOLDS. This is a gateway request
# log whose load-bearing columns are already preserved on the vault, verified
# before each run. Deleting a re-derivable operational log after proving the
# derivations survive is housekeeping, not destruction — and it is the only way
# this disk stops filling.
#
#   enforce-log-retention.sh            dry run (default)
#   enforce-log-retention.sh --apply    delete, after verifying the slice
set -uo pipefail

DB="${LOG_DB_OVERRIDE:-$HOME/.config/bifrost/logs.db}"
DAYS="${RETENTION_DAYS:-3}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APPLY=0
[ "${1:-}" = "--apply" ] && APPLY=1

[ -f "$DB" ] || { echo "log not present: $DB" >&2; exit 70; }

before_rows=$(sqlite3 "file:$DB?mode=ro" "select count(*) from logs;" 2>/dev/null)
before_bytes=$(/usr/bin/stat -f%z "$DB" 2>/dev/null)
stale=$(sqlite3 "file:$DB?mode=ro" "select count(*) from logs where timestamp < datetime('now','-$DAYS days');" 2>/dev/null)

echo "retention window : $DAYS days"
echo "rows total       : ${before_rows:-unknown}"
echo "rows older       : ${stale:-unknown}"
printf "file size        : %.2f GB\n" "$(echo "${before_bytes:-0} / 1073741824" | bc -l)"

# NOT an early exit. Row eviction and body pruning are independent: measured
# 2026-08-05, "rows older: 0" while 2,976 rows still carried a raw_request. The
# first version exited here and never reached the prune — which is the step that
# actually controls the file size, since deleting 136 expired rows made the file
# GROW. Zero rows to evict says nothing about bytes to reclaim.
# UNREADABLE IS NOT EMPTY. Measured 2026-08-05: pointed at a file containing the
# literal text "not a database", this script printed "rows total: unknown", then
# "no rows past the window", then "nothing to do", and exited 0. A nightly cron
# against a corrupt log would report success forever.
#
# Same shape as the rebuild guard fixed earlier today: a default turned a broken
# INPUT into a plausible ANSWER. Here the queries return empty, ${stale:-0}
# reads 0, and 0 is indistinguishable from "healthy, nothing expired".
if [ -z "${before_rows:-}" ] || [ -z "${stale:-}" ]; then
  echo "REFUSING: cannot read the log database — counts came back empty, not zero." >&2
  echo "  A corrupt or wrong-schema file must not be reported as 'nothing to do'." >&2
  sqlite3 "file:$DB?mode=ro" "pragma quick_check(1);" 2>&1 | sed 's/^/  /' >&2
  exit 75
fi
if [ "${stale:-0}" -eq 0 ]; then
  echo "no rows past the window"
fi
prunable=$(sqlite3 "file:$DB?mode=ro" "select count(*) from logs where timestamp < datetime('now','-${PRUNE_AFTER_HOURS:-6} hours') and (raw_request is not null or content_summary is not null or raw_response is not null);" 2>/dev/null)
echo "rows with bodies : ${prunable:-0} (older than ${PRUNE_AFTER_HOURS:-6}h)"
if [ "${stale:-0}" -eq 0 ] && [ "${prunable:-0}" -eq 0 ]; then
  echo "nothing to do"
  exit 0
fi

if [ "$APPLY" -eq 0 ]; then
  echo
  echo "(dry run — pass --apply: evict $stale row(s), prune ${prunable:-0} body row(s))"
  exit 0
fi

# The derivation slice must verify BEFORE anything is deleted. Five declared
# derivations read this log's columns; if the slice cannot answer them, deleting
# the source would orphan claims that ground in those numbers.
echo
echo "checking the vault slice can still answer the derivations..."
# Ask the SLICE directly, not "does the slice agree with live". Measured
# 2026-08-05: after the first eviction the slice reported 1/5 against live —
# correct, because live no longer holds the deleted rows and the slice does.
# A guard that reads that as "stale slice" refuses forever after the first
# successful run, which would make the safety check a permanent blocker.
#
# What matters is that the slice ANSWERS. If it returns the values the
# derivations need, the payload can go.
# Overridable so the self-test can drive THIS script against fixtures. A
# destructive path that can only be tested against the real database never
# gets tested — measured 2026-08-05: my first retention self-test passed 5 of
# 6 cases with this script DELETED, because the cases asserted things about
# sqlite and my own fixtures instead of exercising the script.
SLICE="${SLICE_OVERRIDE:-/Volumes/SISO-STORAGE-VAULT/SISO-VAULT/librarian-vault/bifrost-logs/derivation-archive/logs-derivation-slice.db}"
[ -f "$SLICE" ] || { echo "REFUSING: no vault slice at $SLICE" >&2; exit 75; }
ok=0
for probe in \
  "select sum(prompt_tokens) from logs where provider='CodexOpenAI' and timestamp <= '2026-08-04 04:19:50';" \
  "select sum(completion_tokens) from logs where provider='CodexOpenAI' and timestamp <= '2026-08-04 04:19:50';" \
  "select count(*) from logs where provider='CodexOpenAI' and prompt_tokens>0 and timestamp <= '2026-08-04 04:19:50';" \
  "select round(sum(completion_tokens)*1000.0/(sum(prompt_tokens)-sum(cached_read_tokens)),2) from logs where provider='CodexOpenAI' and prompt_tokens>0;"; do
  v=$(sqlite3 "file:$SLICE?mode=ro" "$probe" 2>/dev/null)
  # An empty answer is a failure, not a zero. Two blanks compare equal.
  [ -n "$v" ] && ok=$((ok+1)) || echo "  UNANSWERED: $probe" >&2
done
[ "$ok" -eq 4 ] || { echo "REFUSING: slice answered $ok/4 derivation probes" >&2; exit 75; }
echo "slice answers $ok/4 derivation probes"

# REFRESH FIRST, THEN RE-VERIFY. The check above proves the EXISTING slice still
# answers; it says nothing about the rows about to be deleted. Measured
# 2026-08-05: of the 136 rows past the window, 52 are CodexOpenAI and 44 are
# Minimax — exactly the providers all five derivations read. Deleting them
# against a stale slice would change every answer. So rebuild the slice to
# include them, then verify AGAIN, and only then delete.
# Refresh the slice so it absorbs the rows about to be deleted. The slice
# ACCUMULATES, so this can only add.
SLICE_OVERRIDE="$SLICE" LIVE_OVERRIDE="$DB" bash "$ROOT/scripts/archive-log-slice.sh" >/dev/null 2>&1 || { echo "slice refresh failed" >&2; exit 75; }

# Re-probe the SLICE, not "does the slice agree with live". Measured 2026-08-05:
# a --verify comparison here refused at 1/5 and blocked the script entirely —
# after any successful eviction live and slice ALWAYS differ, which is the whole
# point of an archive. The first version of this script shipped with that guard
# and could never have deleted anything a second time.
ok2=0
for probe in \
  "select sum(prompt_tokens) from logs where provider='CodexOpenAI' and timestamp <= '2026-08-04 04:19:50';" \
  "select sum(completion_tokens) from logs where provider='CodexOpenAI' and timestamp <= '2026-08-04 04:19:50';" \
  "select count(*) from logs where provider='CodexOpenAI' and prompt_tokens>0 and timestamp <= '2026-08-04 04:19:50';" \
  "select round(sum(completion_tokens)*1000.0/(sum(prompt_tokens)-sum(cached_read_tokens)),2) from logs where provider='CodexOpenAI' and prompt_tokens>0;"; do
  v=$(sqlite3 "file:$SLICE?mode=ro" "$probe" 2>/dev/null)
  [ -n "$v" ] && ok2=$((ok2+1))
done
[ "$ok2" -eq 4 ] || { echo "REFUSING: refreshed slice answers only $ok2/4 probes" >&2; exit 75; }
echo "slice refreshed and re-probed: $ok2/4"

deleted=$(sqlite3 "$DB" "delete from logs where timestamp < datetime('now','-$DAYS days'); select changes();" 2>&1)
echo "deleted rows     : $deleted"

# PRUNE THE BODY COLUMNS on rows that are kept. Measured 2026-08-05: deleting
# 136 expired rows and vacuuming made the file GROW 9.42 -> 9.45 GB, because
# those rows were the oldest and smallest while live traffic outpaced them.
# Row-count retention does not control this file. Size does, and the size is one
# column: raw_request holds 3.85 GB, a verbatim copy of my own prompt on every
# request.
#
# Verified before writing this: ZERO declared derivations read raw_request,
# content_summary or raw_response — checked against every derivations block in
# metrics/ and the observatory snapshot, NOT against a grep of whole files,
# because those column names appear in prose describing the growth.
#
# Rows keep their identity, timings, provider, model and token counts. What goes
# is the payload nothing queries.
PRUNE_AFTER="${PRUNE_AFTER_HOURS:-6}"
pruned=$(sqlite3 "$DB" "
  update logs set raw_request = null, content_summary = null, raw_response = null
  where timestamp < datetime('now','-$PRUNE_AFTER hours')
    and (raw_request is not null or content_summary is not null or raw_response is not null);
  select changes();" 2>&1)
echo "pruned bodies    : $pruned rows older than ${PRUNE_AFTER}h"

# VACUUM only if there is room. Measured 2026-08-05 on a COPY of this database:
# "Error: stepping, database or disk is full (13)". VACUUM rebuilds the file
# alongside the original, so it needs roughly 2x the file size in free space —
# 9.5 GB here against 19 GB free, with a live gateway writing throughout. On the
# real database that failure would have landed mid-rebuild.
#
# Skipping it is not a loss. Nulling the body columns frees PAGES INSIDE the
# file, and SQLite reuses free pages for new rows — so the file stops growing
# even though it does not shrink. auto_vacuum is NONE here, so incremental
# vacuum is unavailable without exactly the rebuild we are avoiding.
free_kb=$(df -k / | awk 'NR==2{print $4}')
size_kb=$(( $(/usr/bin/stat -f%z "$DB") / 1024 ))
if [ "${free_kb:-0}" -gt $(( size_kb * 5 / 2 )) ]; then
  echo "vacuuming (free space is sufficient)..."
  sqlite3 "$DB" "vacuum;" 2>&1
else
  echo "skipping vacuum: need ~$(( size_kb * 5 / 2 / 1048576 )) GB free, have $(( free_kb / 1048576 )) GB"
  echo "  (freed pages are reused by new rows — the file stops growing, it does not shrink)"
  sqlite3 "$DB" "pragma freelist_count;" 2>&1 | sed 's/^/  freelist pages now: /'
fi

after_rows=$(sqlite3 "file:$DB?mode=ro" "select count(*) from logs;" 2>/dev/null)
after_bytes=$(/usr/bin/stat -f%z "$DB" 2>/dev/null)
echo
echo "rows  : ${before_rows} -> ${after_rows}"
printf "bytes : %.2f GB -> %.2f GB\n" \
  "$(echo "${before_bytes:-0} / 1073741824" | bc -l)" \
  "$(echo "${after_bytes:-0} / 1073741824" | bc -l)"
sqlite3 "file:$DB?mode=ro" "pragma quick_check(1);" 2>&1
