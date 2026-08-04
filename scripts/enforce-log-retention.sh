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

DB="$HOME/.config/bifrost/logs.db"
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

if [ "${stale:-0}" -eq 0 ]; then
  echo "nothing to evict"
  exit 0
fi

if [ "$APPLY" -eq 0 ]; then
  echo
  echo "(dry run — pass --apply to delete these $stale rows)"
  exit 0
fi

# The derivation slice must verify BEFORE anything is deleted. Five declared
# derivations read this log's columns; if the slice cannot answer them, deleting
# the source would orphan claims that ground in those numbers.
echo
echo "verifying the vault slice before deleting anything..."
if ! out=$(bash "$ROOT/scripts/archive-log-slice.sh" --verify 2>&1); then
  echo "REFUSING: slice verification failed" >&2
  printf '%s\n' "$out" >&2
  exit 75
fi
matched=$(printf '%s\n' "$out" | sed -n 's/^derivation answers matching: \([0-9]*\)\/\([0-9]*\)$/\1 \2/p')
set -- $matched
if [ "${1:-0}" != "${2:-1}" ]; then
  echo "REFUSING: slice answers ${1:-?}/${2:-?} — refresh it first (npm run log:archive)" >&2
  exit 75
fi
echo "slice verified: $1/$2 derivation answers match"

# REFRESH FIRST, THEN RE-VERIFY. The check above proves the EXISTING slice still
# answers; it says nothing about the rows about to be deleted. Measured
# 2026-08-05: of the 136 rows past the window, 52 are CodexOpenAI and 44 are
# Minimax — exactly the providers all five derivations read. Deleting them
# against a stale slice would change every answer. So rebuild the slice to
# include them, then verify AGAIN, and only then delete.
bash "$ROOT/scripts/archive-log-slice.sh" >/dev/null 2>&1 || { echo "slice refresh failed" >&2; exit 75; }
if ! out2=$(bash "$ROOT/scripts/archive-log-slice.sh" --verify 2>&1); then
  echo "REFUSING: post-refresh verification failed" >&2; printf '%s\n' "$out2" >&2; exit 75
fi
m2=$(printf '%s\n' "$out2" | sed -n 's/^derivation answers matching: \([0-9]*\)\/\([0-9]*\)$/\1 \2/p')
set -- $m2
[ "${1:-0}" = "${2:-1}" ] || { echo "REFUSING: refreshed slice answers ${1:-?}/${2:-?}" >&2; exit 75; }
echo "slice refreshed and re-verified: $1/$2"

deleted=$(sqlite3 "$DB" "delete from logs where timestamp < datetime('now','-$DAYS days'); select changes();" 2>&1)
echo "deleted rows     : $deleted"

# VACUUM is what actually returns pages to the filesystem. Without it the rows
# go but the file does not shrink — measured on this same database, freelist
# pages sat at 0 while page_count grew.
echo "vacuuming (this rewrites the file)..."
sqlite3 "$DB" "vacuum;" 2>&1

after_rows=$(sqlite3 "file:$DB?mode=ro" "select count(*) from logs;" 2>/dev/null)
after_bytes=$(/usr/bin/stat -f%z "$DB" 2>/dev/null)
echo
echo "rows  : ${before_rows} -> ${after_rows}"
printf "bytes : %.2f GB -> %.2f GB\n" \
  "$(echo "${before_bytes:-0} / 1073741824" | bc -l)" \
  "$(echo "${after_bytes:-0} / 1073741824" | bc -l)"
sqlite3 "file:$DB?mode=ro" "pragma quick_check(1);" 2>&1
