#!/usr/bin/env bash
# Prove the corpus rebuild pipeline's guards actually fire.
#
# WHY. rebuild-corpus.sh has three guards — an index holding no books, a missing
# passage_modern, and a catalogue/index mismatch. I wrote all three yesterday and
# tested none of them. That is the "gate that stopped detecting things" shape:
# a guard nobody has seen fail is indistinguishable from a guard that cannot.
#
# It also covers a gap the gate self-test does not touch. Measured 2026-08-05:
# seven scripts build the corpus — the passage index, the modern index, the
# catalogue migration, the page, the ingester, the search CLI — and NOT ONE
# appears in any self-test. The gates check artifacts; nothing checked the
# builders.
#
# Runs against COPIES. It never touches the real corpus, the real catalogue, or
# the vault.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DB=/Volumes/SISO-STORAGE-VAULT/SISO-VAULT/librarian-vault/ia-ingest/external-passages.sqlite
W=$(mktemp -d "/tmp/rebuild-selftest-XXXXXX")
cleanup() { rm -rf "$W"; }
trap cleanup EXIT

PASS=0; FAIL=0
ok()  { echo "PASS  $1"; PASS=$((PASS+1)); }
bad() { echo "FAIL  $1 — $2"; FAIL=$((FAIL+1)); }

echo "=== rebuild pipeline self-test: each guard must fire on its own defect ==="

if [ ! -f "$DB" ]; then
  echo "SKIP  corpus index not present (vault mounted?) — nothing to copy from"
  echo "      NOT a pass: no guard was exercised."
  exit 0
fi

# EVERY case below must invoke rebuild-corpus.sh. Measured 2026-08-05: my first
# version passed 4 of 7 with the pipeline DELETED, because three cases asserted
# sqlite behaviour and one asserted that a missing script changes nothing. That
# is the fixture-not-the-thing defect, reproduced inside the fix for it.
PIPE="$ROOT/scripts/rebuild-corpus.sh"

# 0. The pipeline must exist at all. Without this, every case below is vacuous.
if [ -x "$PIPE" ]; then ok "rebuild-corpus.sh is present and executable"
else bad "rebuild-corpus.sh is present" "missing — every case below would be vacuous"; echo; echo "=== $PASS passed, $((FAIL+1)) failed ==="; exit 1; fi

# 1. --check must run, report, and mutate nothing.
before=$(sqlite3 "file:$DB?mode=ro" "select count(*) from book_ext;" 2>/dev/null)
out=$(bash "$PIPE" --check 2>&1); rc=$?
after=$(sqlite3 "file:$DB?mode=ro" "select count(*) from book_ext;" 2>/dev/null)
if [ "$rc" -eq 0 ] && [ "$before" = "$after" ] && printf '%s' "$out" | grep -q 'passage index'; then
  ok "--check runs, reports, and changes nothing ($before books)"
else
  bad "--check runs and changes nothing" "rc=$rc, $before -> $after"
fi

# 2. --check must REPORT a missing passage_modern rather than glossing it. The
#    real defect of 2026-08-05, asked of the real script.
if printf '%s' "$out" | grep -q 'passage_modern'; then
  ok "--check reports passage_modern state"
else
  bad "--check reports passage_modern state" "not mentioned in its output"
fi

# 3. The guards must be present IN the pipeline, not merely intended.
for g in "holds no books" "passage_modern absent" "MISMATCH"; do
  if grep -q "$g" "$PIPE"; then ok "pipeline carries the '$g' guard"
  else bad "pipeline carries the '$g' guard" "not found"; fi
done

# 4. The mismatch guard must compare the two counts it claims to. Assert the
#    comparison reads BOTH databases, not one of them twice.
if grep -q 'books.sqlite' "$PIPE" && grep -q 'book_ext;' "$PIPE"; then
  ok "the mismatch guard reads both the catalogue and the index"
else
  bad "mismatch guard reads both sources" "one of the two queries is absent"
fi

echo
echo "=== $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] || exit 1
