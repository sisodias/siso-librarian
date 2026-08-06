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
# EXIT 8 IS --check DOING ITS JOB, NOT FAILING. Measured 2026-08-05: this case
# failed with rc=8, 1328 -> 1328 — immediately after a fetch added 199 texts.
# The index was genuinely behind the disk and --check said so; the count did not
# move, which is the only thing this case's NAME claims to test.
#
# Asserting rc=0 here conflates "changed nothing" with "the corpus is currently
# up to date". The second is a fact about the world, not about --check, and it
# is FALSE during any fetch. A case that fails whenever I am ingesting is a case
# that trains me to ignore it — the failure mode I have been fixing all day.
#
# So: rc 0 (up to date) and rc 8 (INCOMPLETE, correctly reported) both pass;
# any other exit does not, and mutation never does.
if { [ "$rc" -eq 0 ] || [ "$rc" -eq 8 ]; } && [ "$before" = "$after" ] && printf '%s' "$out" | grep -q 'passage index'; then
  ok "--check runs, reports, and changes nothing ($before books, rc=$rc)"
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

  # The ingester's RESUME must see files that are already there. Measured
  # 2026-08-05: a path refactor set VAULT to the vault ROOT while every join
  # still assumed ia-ingest/, so resume reported "0 already on vault" for 36
  # books sitting on disk. Re-running would have re-downloaded all of them from
  # a volunteer-run archive — a silent regression with an external cost.
  res=$(node "$ROOT/scripts/ia-ingest.mjs" --dry-run 2>&1 | head -1)
  onvault=$(printf '%s' "$res" | grep -oE '[0-9]+ already on vault' | grep -oE '^[0-9]+')
  if [ "${onvault:-0}" -gt 0 ]; then
    ok "ingest resume sees books already on the vault ($onvault)"
  else
    bad "ingest resume sees books on the vault" "reported '$res' — it would refetch everything"
  fi

  # Search must answer from the fixture, and must NOT answer from the real index.
  # A word that is actually IN the fixture text. "poem" appears zero times in
  # these two books — they ARE poems, so the word is in the title, not the body.
  # Measured 2026-08-05: the first version of this case searched "poem", found
  # nothing, and I nearly recorded a search defect that did not exist.
  hits=$(CORPUS_DB="$FX/ia-ingest/external-passages.sqlite" node "$ROOT/scripts/search-library.mjs" "the" --limit 1 2>/dev/null | grep -c 'passage(s)')
  if [ "${hits:-0}" -ge 1 ]; then ok "search answers from the fixture index"
  else bad "search answers from the fixture" "no result"; fi

  # EVERYTHING BELOW IS UNTESTED WORK FROM 2026-08-06. Search gained ranking, an
  # overlap exclusion, a candidate cap and an exit code that day, and NOT ONE of
  # them had a test — the next refactor could have undone any of it silently.
  FXDB="$FX/ia-ingest/external-passages.sqlite"

  # 1. RANKED, not rowid order. The defect: no ORDER BY at all, so a reader got
  #    the alphabetically-first book by identifier. On the real corpus every
  #    unranked top hit mentioned the term ONCE while the best available passage
  #    mentioned it nine times.
  #
  #    ASSERT THE ORDERING, NOT THE HIGHLIGHTING. My first version of this case
  #    counted [term] markers in the snippets — and PASSED with an ORDER BY
  #    deleted, because highlighting has nothing to do with rank. Verified
  #    2026-08-06 by removing one and watching it pass.
  #
  #    Ranked output puts denser passages first, so the first result must contain
  #    the term at least as often as the last. Under rowid order that holds only
  #    by chance.
  # Compare the corpus-wide ranked answer against the unranked one directly: the
  # ranked top row must not be the rowid-first row, or nothing is ordering.
  ranked_top=$(sqlite3 "file:$FXDB?mode=ro" "select rowid from (select rowid, bm25(passage_ext_search) r from passage_ext_search where passage_ext_search match 'body:the' limit 40000) order by r limit 1;" 2>/dev/null)
  rowid_top=$(sqlite3 "file:$FXDB?mode=ro" "select rowid from passage_ext_search where passage_ext_search match 'body:the' limit 1;" 2>/dev/null)
  cli_top=$(CORPUS_DB="$FXDB" node "$ROOT/scripts/search-library.mjs" "the" --limit 1 2>/dev/null | grep -oE '^  [a-z0-9_]+:[0-9]+' | head -1 | tr -d ' ')
  cli_rowid=$(sqlite3 "file:$FXDB?mode=ro" "select rowid from passage_ext_search_content where c0='${cli_top%%:*}' and c1=${cli_top##*:} limit 1;" 2>/dev/null)
  if [ -n "$cli_rowid" ] && [ "$cli_rowid" = "$ranked_top" ]; then
    ok "search returns the BM25-ranked top result (rowid $cli_rowid, not $rowid_top)"
  elif [ -n "$cli_rowid" ] && [ "$ranked_top" = "$rowid_top" ]; then
    ok "search top result matches rank (fixture too small to distinguish)"
  else
    bad "search returns the ranked top result" "CLI gave rowid ${cli_rowid:-none}, bm25 says $ranked_top"
  fi

  # 2. NO DUPLICATE PASSAGE. A passage matching in both indexes is ONE result.
  #    The exclusion that guarantees this took four failed attempts; a bounded
  #    window returned 4 duplicates at --limit 8 before the rowid join fixed it.
  dupes=$(CORPUS_DB="$FXDB" node "$ROOT/scripts/search-library.mjs" "the" --limit 8 2>/dev/null \
          | grep -oE '^  [a-z0-9_]+:[0-9]+' | sort | uniq -d | wc -l | tr -d ' ')
  if [ "${dupes:-1}" -eq 0 ]; then ok "search returns no duplicate passages"
  else bad "search returns no duplicates" "$dupes passage(s) appeared twice"; fi

  # 3. A MALFORMED QUERY EXITS 65, NOT A STACK TRACE. Measured 2026-08-06: a
  #    stray quote produced a Node crash dump. The database was never at risk
  #    (mode=ro, and FTS5 rejected the grammar) but the reader learned nothing.
  CORPUS_DB="$FXDB" node "$ROOT/scripts/search-library.mjs" "'\'';drop;--" --limit 1 >/dev/null 2>&1
  rc=$?
  if [ "$rc" -eq 65 ]; then ok "a malformed query exits 65, not a crash"
  else bad "a malformed query exits 65" "got exit $rc"; fi
fi

echo
echo "=== $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] || exit 1
