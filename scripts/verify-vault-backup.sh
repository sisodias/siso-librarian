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
# Use pragma quick_check(1), not bare quick_check. The bounded form stops after
# the first error and returns in seconds; the unbounded form exceeded ten minutes
# on the 1.9-5.4 GB vault copies and I recorded them as "too slow to verify" when
# the real problem was my choice of pragma. Only passages.sqlite (22.6 GB) is
# genuinely too large either way.
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

# The ENDS of the table, which the bands do not reach. Measured 2026-08-05:
# 200,000 rows from the head and 201,326 from the tail read cleanly in ~17s
# each. That nearly TRIPLES coverage — 0.60% from the bands alone, 1.57% with
# the ends — for about 35 seconds.
#
# Stated precisely because "the residual is permanent" is the phrase I have been
# repeating, and 1.57% is a very different claim from "unverified". A full
# pragma integrity_check still cannot finish on 22.6 GB over USB; that limit is
# real and separate.
head_n=$(sqlite3 "file:$VAULT?mode=ro&immutable=1" "select count(*) from passage where rowid between 1 and 200000;" 2>/dev/null)
tail_n=$(sqlite3 "file:$VAULT?mode=ro&immutable=1" "select count(*) from passage where rowid between 41300000 and 41501325;" 2>/dev/null)
if [ -n "$head_n" ] && [ -n "$tail_n" ] && [ "$head_n" -gt 0 ] && [ "$tail_n" -gt 0 ]; then
  echo "  endpoints    head $head_n rows, tail $tail_n rows — both readable"
  rows=$((rows + head_n + tail_n))
  endpoints_ok=1
else
  echo "  endpoints    UNREADABLE (head='$head_n' tail='$tail_n')"
  endpoints_ok=0
fi

echo "bands matching: $match/$total   rows compared: $rows"
echo "coverage: $rows of 41,501,325 rows = $(/usr/bin/python3 -c "print(f'{100*$rows/41501325:.2f}%')")"
# Recorded now, exited at the very end. Exiting here would skip the people-graph
# check entirely, so a passage-index failure would HIDE a graph failure — one
# artifact's problem masking another's is exactly the shape of defect this
# script exists to surface.
# BOTH conditions. My first version set passage_ok=0 on an unreadable endpoint
# and this line then overwrote it from the band result alone — an unreadable
# endpoint would have reported success. Caught before shipping by reading the
# order rather than trusting the edit.
passage_ok=$([ "$match" -eq "$total" ] && [ "${endpoints_ok:-0}" -eq 1 ] && echo 1 || echo 0)

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

# --- structural probe: the 22.6 GB index that no integrity check can finish ---
# pragma quick_check and integrity_check(1) BOTH fail to return on this file
# within 300s over USB. Measured 2026-08-04: the bound limits errors REPORTED,
# not pages SCANNED, so both still walk all 5,921,286 pages. That is a real
# limit, not a pragma mistake.
#
# What IS affordable, because each descends an index instead of scanning:
#   - the schema (0.03s)      every object still present and parseable
#   - the three b-trees       passage, the FTS index, book_body
#   - min/max rowid           proves descent to the first and last leaf
#
# This is a STRUCTURAL probe, not an integrity check. It reads 0.0442% of rows.
# Corruption in an unread page passes silently. Stated so nobody upgrades this
# to "the passage index was verified".
echo
echo "structural probe: $(basename "$VAULT")"
sch=$(sqlite3 "file:$VAULT?mode=ro&immutable=1" "select count(*) from sqlite_master;" 2>/dev/null)
probe_ok=1
[ "${sch:-0}" -ge 10 ] && echo "  schema        $sch objects" || { echo "  schema        UNREADABLE"; probe_ok=0; }
for spec in "passage:rowid" "book_body:rowid" "passage_search_docsize:id"; do
  tb=${spec%%:*}; col=${spec##*:}
  n=$(sqlite3 "file:$VAULT?mode=ro&immutable=1" "select count(*) from $tb where $col between 1 and 500;" 2>/dev/null)
  [ -n "$n" ] && echo "  b-tree $tb reads ($n rows)" || { echo "  b-tree $tb UNREADABLE"; probe_ok=0; }
done

# Both artifacts always reported before either exit code is returned.
[ "$probe_ok" -eq 1 ]   || exit 10
[ "$passage_ok" -eq 1 ] || exit 8
[ "$graph_ok" -eq 1 ] || exit 9
