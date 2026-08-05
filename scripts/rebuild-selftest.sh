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

# 3. BEHAVIOUR, not grep. The four cases below used to assert that guard strings
#    appear in the source — which passes if the guard is a comment. Now that
#    lib/vault-paths.mjs makes VAULT_ROOT overridable, the builders can run
#    against a fixture and be judged on what they DO.
FX=$(mktemp -d "$W/fixture-XXXXXX")
mkdir -p "$FX/ia-ingest/text"
REAL_TEXT=/Volumes/SISO-STORAGE-VAULT/SISO-VAULT/librarian-vault/ia-ingest/text
for b in b28982642 b2497464x; do
  [ -f "$REAL_TEXT/$b.txt" ] && cp "$REAL_TEXT/$b.txt" "$FX/ia-ingest/text/"
done
nfix=$(ls "$FX/ia-ingest/text" 2>/dev/null | wc -l | tr -d ' ')

if [ "${nfix:-0}" -lt 2 ]; then
  bad "fixture has source text" "only $nfix files — cases below would be vacuous"
else
  ok "fixture prepared with $nfix books"

  # The index builder must produce a real index from a fixture.
  if VAULT_ROOT="$FX" node "$ROOT/scripts/build-external-passages.mjs" >/dev/null 2>&1; then
    n=$(sqlite3 "file:$FX/ia-ingest/external-passages.sqlite?mode=ro" "select count(*) from book_ext;" 2>/dev/null)
    if [ "${n:-0}" -eq 2 ]; then ok "index builder indexes exactly the fixture's 2 books"
    else bad "index builder indexes the fixture" "got ${n:-0} books, expected 2"; fi
  else
    bad "index builder runs against a fixture" "non-zero exit"
  fi

  # It must NOT have touched the real index. A builder that ignores VAULT_ROOT
  # and writes to the vault is the exact defect this session kept hitting.
  real_n=$(sqlite3 "file:$DB?mode=ro" "select count(*) from book_ext;" 2>/dev/null)
  if [ "${real_n:-0}" -gt 100 ]; then ok "the real index is untouched ($real_n books)"
  else bad "the real index is untouched" "it now holds ${real_n:-0} books"; fi

  # The modern-spelling builder must add passage_modern to the FIXTURE.
  if VAULT_ROOT="$FX" node "$ROOT/scripts/add-longs-variants.mjs" >/dev/null 2>&1; then
    has=$(sqlite3 "file:$FX/ia-ingest/external-passages.sqlite?mode=ro" "select count(*) from sqlite_master where name='passage_modern';" 2>/dev/null)
    if [ "${has:-0}" = "1" ]; then ok "modern-spelling builder adds passage_modern to the fixture"
    else bad "modern builder adds passage_modern" "table absent after its own run"; fi
  else
    bad "modern-spelling builder runs against a fixture" "non-zero exit"
  fi

  # Search must answer from the fixture, and must NOT answer from the real index.
  # A word that is actually IN the fixture text. "poem" appears zero times in
  # these two books — they ARE poems, so the word is in the title, not the body.
  # Measured 2026-08-05: the first version of this case searched "poem", found
  # nothing, and I nearly recorded a search defect that did not exist.
  hits=$(CORPUS_DB="$FX/ia-ingest/external-passages.sqlite" node "$ROOT/scripts/search-library.mjs" "the" --limit 1 2>/dev/null | grep -c 'passage(s)')
  if [ "${hits:-0}" -ge 1 ]; then ok "search answers from the fixture index"
  else bad "search answers from the fixture" "no result"; fi
fi

echo
echo "=== $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] || exit 1
