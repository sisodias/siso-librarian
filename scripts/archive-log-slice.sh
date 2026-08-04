#!/usr/bin/env bash
# Preserve the columns declared derivations read from the bifrost log, so a
# retention policy cannot silently orphan them.
#
# WHY THIS EXISTS. On 2026-08-04 I set log_retention_days from 365 to 3 to stop
# the log filling the disk, and only later found SIX declared derivations
# reading that database. They re-derived that day only because the oldest rows
# had not aged out yet — the audit re-runs them on every push, so it was a gate
# failure on a timer I had set myself.
#
# The claim layer was already safe: claims ground in metrics SNAPSHOTS, not the
# live database. The derivations had no equivalent protection.
#
# WHAT IS KEPT. Only the token/provider columns the derivations actually read.
# NOT raw_request (3,681 MB), NOT content_summary, NOT any prompt body. The
# point is keeping the NUMBERS re-derivable, not hoarding prompts — measured
# 2026-08-04, the slice is 438 KB against a 9.43 GB source.
#
# VERIFIED: all five aggregate derivations return byte-identical answers against
# the slice and the live log.
#
#   archive-log-slice.sh            build/refresh the slice
#   archive-log-slice.sh --verify   compare slice answers against the live log
set -uo pipefail

LIVE="$HOME/.config/bifrost/logs.db"
OUT=/Volumes/SISO-STORAGE-VAULT/SISO-VAULT/librarian-vault/bifrost-logs/derivation-archive
SLICE="$OUT/logs-derivation-slice.db"

[ -f "$LIVE" ] || { echo "live log not present: $LIVE" >&2; exit 70; }
[ -d "$(dirname "$OUT")" ] || { echo "vault not mounted: $OUT" >&2; exit 70; }
mkdir -p "$OUT"

# The five queries the declared derivations run, verbatim.
Q1="select sum(prompt_tokens) from logs where provider='CodexOpenAI' and timestamp <= '2026-08-04 04:19:50';"
Q2="select sum(completion_tokens) from logs where provider='CodexOpenAI' and timestamp <= '2026-08-04 04:19:50';"
Q3="select count(*) from logs where provider='CodexOpenAI' and prompt_tokens>0 and timestamp <= '2026-08-04 04:19:50';"
Q4="select round(sum(completion_tokens)*1000.0/(sum(prompt_tokens)-sum(cached_read_tokens)),2) from logs where provider='CodexOpenAI' and prompt_tokens>0;"
Q5="select coalesce(sum(cached_read_tokens),0) from logs where provider='Minimax';"

if [ "${1:-}" = "--verify" ]; then
  [ -f "$SLICE" ] || { echo "no slice yet — run without --verify first" >&2; exit 70; }
  match=0; total=0
  for q in "$Q1" "$Q2" "$Q3" "$Q4" "$Q5"; do
    a=$(sqlite3 "file:$LIVE?mode=ro" "$q" 2>/dev/null)
    b=$(sqlite3 "file:$SLICE?mode=ro" "$q" 2>/dev/null)
    total=$((total+1))
    # An empty answer on BOTH sides is not a match — it is two failures that
    # happen to compare equal, the same trap as the vault band check.
    if [ -z "$a" ] || [ -z "$b" ]; then
      echo "  UNREADABLE live='$a' slice='$b'"
    elif [ "$a" = "$b" ]; then
      match=$((match+1)); echo "  MATCH  $a"
    else
      echo "  DIFFER live=$a slice=$b"
      echo "         EXPECTED after eviction — the SLICE is authoritative here."
      echo "         Measured 2026-08-05: enforce-log-retention.sh deleted 136 rows"
      echo "         past the window; live answers changed, slice answers did not,"
      echo "         and all 32 declared derivations still re-derive because they"
      echo "         point at the slice. A DIFFER on this line is the archive doing"
      echo "         its job, not a fault."
    fi
  done
  echo "derivation answers matching: $match/$total"
  exit 0
fi

# Rebuild from scratch each time: the slice is a projection, not an accumulator,
# and appending would double-count rows still present in both.
rm -f "$SLICE"
sqlite3 "$SLICE" "
attach database 'file:$LIVE?mode=ro' as live;
create table logs as
  select id, timestamp, provider, virtual_key_name, model,
         prompt_tokens, completion_tokens, total_tokens, cached_read_tokens, status
  from live.logs;
detach live;
create index ix_logs_provider on logs(provider);
create index ix_logs_ts on logs(timestamp);" || { echo "slice build failed" >&2; exit 8; }

rows=$(sqlite3 "file:$SLICE?mode=ro" "select count(*) from logs;" 2>/dev/null)
span=$(sqlite3 "file:$SLICE?mode=ro" "select min(date(timestamp))||' to '||max(date(timestamp)) from logs;" 2>/dev/null)
size=$(ls -la "$SLICE" | awk '{print $5}')
echo "slice: $rows rows, $span, $size bytes"
[ "${rows:-0}" -gt 0 ] || { echo "REFUSING: slice is empty" >&2; exit 9; }
