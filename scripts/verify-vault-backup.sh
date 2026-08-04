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
[ "$match" -eq "$total" ] || exit 8
