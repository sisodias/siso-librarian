#!/usr/bin/env bash
# Compare the vaulted passage index against the live one by banded checksum.
#
# NOT part of `npm run verify`, deliberately. Every query here touches USB
# storage, and on 2026-08-04 declaring a single vault derivation turned a
# 58-second gate chain into one that never finished — `select count(*) from
# passage` ran past 2m09s on 41.5M rows while the self-test invoked the audit a
# dozen times. A gate slow enough to skip is a gate that gets skipped, so this
# is a separate command run when the backup matters, not on every push.
#
# Why bands rather than a full checksum: a whole-table scan timed out at ten
# minutes. rowid ranges use the primary key index and return in seconds. This
# samples ~0.6% of the table across its whole span — materially stronger than
# spot-checking three rows, materially weaker than checksumming everything.
# Corruption confined to an unsampled band still passes, and that is stated
# rather than glossed.
#
# immutable=1 is required for WAL-header copies (write_version 2), which cannot
# open read-only without creating a -shm sidecar beside them.
#
# DO NOT SCHEDULE THIS UNDER LAUNCHD without granting Full Disk Access first.
# Measured 2026-08-04: com.siso.agentbase fails with
#   Error: EPERM: process.cwd failed with error operation not permitted, uv_cwd
# on a /Volumes working directory that an interactive shell reads without any
# trouble. launchd agents do not inherit the Full Disk Access grant macOS
# requires for external volumes, so a scheduled copy of this script would report
# the vault unreadable and its exit-8/9 paths would fire — an alarm about a
# healthy backup. Run it interactively, or grant access deliberately.
set -uo pipefail

LIVE="$HOME/passages.sqlite"
VAULT=/Volumes/SISO-STORAGE-VAULT/SISO-VAULT/librarian-vault/passage-index/passages.sqlite

[ -f "$LIVE" ]  || { echo "live index not present: $LIVE" >&2; exit 70; }
[ -f "$VAULT" ] || { echo "vault copy not present (is the volume mounted?): $VAULT" >&2; exit 70; }

BANDS="1 10000000 20000000 30000000 41450000"
WIDTH=50000

echo "banded checksum: live vs vault, ${WIDTH}-row bands"
match=0; total=0; rows=0

for lo in $BANDS; do
  hi=$((lo + WIDTH))
  q="select count(*)||'|'||sum(chars)||'|'||sum(words)||'|'||sum(length(coalesce(preview,'')))
     from passage where rowid between $lo and $hi;"
  a=$(sqlite3 "file:$LIVE?mode=ro" "$q" 2>/dev/null | head -1)
  b=$(sqlite3 "file:$VAULT?mode=ro&immutable=1" "$q" 2>/dev/null | head -1)
  total=$((total + 1))

  # An empty result from either side is a FAILURE, not a match. Two blank
  # strings compare equal, which would silently report a mounted-but-unreadable
  # vault as a perfect backup.
  if [ -z "$a" ] || [ -z "$b" ]; then
    printf "  %-10s..%-10s UNREADABLE (live='%s' vault='%s')\n" "$lo" "$hi" "$a" "$b"
    continue
  fi

  if [ "$a" = "$b" ]; then
    match=$((match + 1)); rows=$((rows + ${a%%|*}))
    printf "  %-10s..%-10s MATCH   %s\n" "$lo" "$hi" "$a"
  else
    printf "  %-10s..%-10s DIFFER  live=%s vault=%s\n" "$lo" "$hi" "$a" "$b"
  fi
done

echo "bands matching: $match/$total   rows compared: $rows"
# Recorded now, exited at the very end. Exiting here would skip the people-graph
# check entirely, so a passage-index failure would HIDE a graph failure — one
# artifact's problem masking another's is exactly the shape of defect this
# script exists to surface.
passage_ok=$([ "$match" -eq "$total" ] && echo 1 || echo 0)

# --- people graph -----------------------------------------------------------
# 1.09 GB rather than 24 GB, so whole-table counts are affordable here and no
# banding is needed. Backed up 2026-08-04 after discovering it had NO vault copy
# at all — the passage index had one, and the graph six claims ground in did not.
GRAPH_LIVE="$HOME/foundry-data/domains/people/people_v2.sqlite"
GRAPH_VAULT=$(ls -t /Volumes/SISO-STORAGE-VAULT/SISO-VAULT/librarian-vault/people-graph/people_v2-*.sqlite 2>/dev/null | head -1)

if [ -n "$GRAPH_VAULT" ] && [ -f "$GRAPH_LIVE" ]; then
  echo
  echo "people graph: full table counts, live vs $(basename "$GRAPH_VAULT")"
  gmatch=0; gtotal=0
  for t in person person_content person_topic external_ids identity_claim; do
    a=$(sqlite3 "file:$GRAPH_LIVE?mode=ro" "select count(*) from $t;" 2>/dev/null)
    b=$(sqlite3 "file:$GRAPH_VAULT?mode=ro&immutable=1" "select count(*) from $t;" 2>/dev/null)
    gtotal=$((gtotal + 1))
    if [ -z "$a" ] || [ -z "$b" ]; then
      printf "  %-16s UNREADABLE (live='%s' vault='%s')\n" "$t" "$a" "$b"
    elif [ "$a" = "$b" ]; then
      gmatch=$((gmatch + 1)); printf "  %-16s MATCH   %s\n" "$t" "$a"
    else
      printf "  %-16s DIFFER  live=%s vault=%s\n" "$t" "$a" "$b"
    fi
  done
  echo "tables matching: $gmatch/$gtotal"
  graph_ok=$([ "$gmatch" -eq "$gtotal" ] && echo 1 || echo 0)
else
  echo
  echo "people graph: NO VAULT COPY FOUND — the live graph is unbacked" >&2
  graph_ok=0
fi

# Both artifacts always reported before either exit code is returned.
[ "$passage_ok" -eq 1 ] || exit 8
[ "$graph_ok" -eq 1 ] || exit 9
