#!/usr/bin/env bash
# Rebuild every corpus artifact in the order they actually depend on.
#
# WHY THIS EXISTS. The order was in my head and one worklog. Measured
# 2026-08-05: build-library-page failed with "no such table: passage_modern",
# because rebuilding the passage index DROPS AND RECREATES the database and
# destroys the modern-spelling table. add-longs-variants has to run between
# them, and nothing said so.
#
# I ran this sequence five times and got it wrong once. That is a 20% failure
# rate on a procedure with no enforcement.
#
# THE DEPENDENCIES, stated once:
#
#   ia-ingest              fetches text + writes a manifest
#     -> migrate-book-external   reads manifests, writes book_external
#     -> build-external-passages reads text, DROPS and recreates the index
#          -> add-longs-variants   reads the index, adds passage_modern
#          -> build-library-page   reads BOTH — fails without passage_modern
#     -> corpus-integrity        reads the index
#
# Each step verifies the one before produced what the next needs, so a partial
# rebuild fails loudly instead of leaving an artifact that looks built.
#
#   rebuild-corpus.sh            full rebuild
#   rebuild-corpus.sh --check    report what exists, change nothing
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1
# Honour the same overrides as lib/vault-paths.mjs. Measured 2026-08-05: this
# was hardcoded, so a fixture test of --check silently read the REAL vault —
# 684 texts instead of the 6 in the fixture. The same hardcoded-path defect
# I fixed in seven .mjs builders, sitting in the pipeline that runs them.
VAULT_ROOT="${VAULT_ROOT:-/Volumes/SISO-STORAGE-VAULT/SISO-VAULT/librarian-vault}"
DB="${CORPUS_DB:-$VAULT_ROOT/ia-ingest/external-passages.sqlite}"
CHECK=0
[ "${1:-}" = "--check" ] && CHECK=1

have_table() { sqlite3 "file:$DB?mode=ro" "select count(*) from sqlite_master where name='$1';" 2>/dev/null; }

if [ "$CHECK" = "1" ]; then
  echo "corpus artifacts:"
  if [ -f "$DB" ]; then
    printf "  %-22s %s books\n" "passage index" "$(sqlite3 "file:$DB?mode=ro" 'select count(*) from book_ext;' 2>/dev/null)"
    printf "  %-22s %s\n" "passage_modern" "$([ "$(have_table passage_modern)" = "1" ] && echo present || echo MISSING)"
  else
    echo "  passage index          MISSING (vault mounted?)"
  fi
  printf "  %-22s %s rows\n" "catalogue" "$(sqlite3 "file:$HOME/foundry-data/domains/books/books.sqlite?mode=ro" 'select count(*) from book_external;' 2>/dev/null)"
  printf "  %-22s %s\n" "library page" "$([ -f public/library.html ] && echo present || echo MISSING)"
  # COMPLETENESS, not just presence. Measured 2026-08-05: deleting rows to
  # simulate a rebuild killed halfway left an index of 300 books against 673
  # texts on disk, and every check reported healthy — "300 books, 0 dupes".
  #
  # build-external-passages removes the index file before writing, so a death
  # mid-run leaves a plausible, smaller, entirely silent result. The corpus has
  # outgrown a ten-minute foreground call, which makes that death likelier, not
  # less.
  texts=$(ls "$(dirname "$DB")/text"/*.txt 2>/dev/null | wc -l | tr -d ' ')
  idx=$(sqlite3 "file:$DB?mode=ro" 'select count(*) from book_ext;' 2>/dev/null)
  printf "  %-22s %s texts on disk\n" "source texts" "$texts"
  if [ "${idx:-0}" -lt "${texts:-0}" ]; then
    # STALE or TRUNCATED? A fetch in flight adds texts the index has not seen
    # yet, which is normal and self-correcting. A truncated index is neither.
    # Distinguish them by looking twice: if the text count is still moving, a
    # fetch is running. Measured 2026-08-05: 677 then 678 twenty seconds apart.
    sleep 12
    texts2=$(ls "$(dirname "$DB")/text"/*.txt 2>/dev/null | wc -l | tr -d ' ')
    if [ "${texts2:-0}" -gt "${texts:-0}" ]; then
      echo "  STALE (not truncated): $idx indexed, $texts -> $texts2 texts — a fetch is in flight; rebuild when it finishes"
      exit 0
    fi
    echo "  INCOMPLETE: the index holds $idx books but $texts texts exist and the count is not moving"
    echo "  A rebuild may have died mid-run — build-external-passages deletes the index before writing."
    exit 8
  fi
  exit 0
fi

step() { echo; echo "=== $1 ==="; }

step "1/5 catalogue (reads manifests)"
node scripts/migrate-book-external.mjs --apply || { echo "migration failed" >&2; exit 1; }

step "2/5 passage index (DROPS and recreates the database)"
node scripts/build-external-passages.mjs || { echo "index build failed" >&2; exit 1; }
books=$(sqlite3 "file:$DB?mode=ro" 'select count(*) from book_ext;' 2>/dev/null)
[ "${books:-0}" -gt 0 ] || { echo "index built but holds no books" >&2; exit 1; }

step "3/5 modern-spelling index (MUST follow step 2 — step 2 destroys it)"
node scripts/add-longs-variants.mjs || { echo "modern index failed" >&2; exit 1; }
[ "$(have_table passage_modern)" = "1" ] || { echo "passage_modern absent after its own build" >&2; exit 1; }
# PRESENT is not COMPLETE. Measured 2026-08-05: after a rebuild to 777 books,
# passage_modern held 334,000 rows against 981,260 passages — a third of the
# corpus — and this step reported success because the TABLE existed.
#
# That is the same presence-versus-completeness distinction I added to the index
# check earlier in this same run, missed one step later.
mod_n=$(sqlite3 "file:$DB?mode=ro" 'select count(*) from passage_modern;' 2>/dev/null)
pas_n=$(sqlite3 "file:$DB?mode=ro" 'select count(*) from passage_ext;' 2>/dev/null)
if [ "${mod_n:-0}" -ne "${pas_n:-1}" ]; then
  echo "passage_modern is INCOMPLETE: $mod_n rows against $pas_n passages" >&2
  exit 1
fi
echo "  passage_modern complete: $mod_n rows"

step "4/5 library page (needs BOTH indexes)"
node scripts/build-library-page.mjs || { echo "page build failed" >&2; exit 1; }

step "5/5 integrity"
node scripts/corpus-integrity.mjs || { echo "integrity check failed" >&2; exit 1; }

# The catalogue and the index must agree. They disagreed by 34 books on
# 2026-08-05 because a manifest was overwritten, and nothing noticed until I
# compared them by hand.
cat_n=$(sqlite3 "file:$HOME/foundry-data/domains/books/books.sqlite?mode=ro" 'select count(*) from book_external;' 2>/dev/null)
idx_n=$(sqlite3 "file:$DB?mode=ro" 'select count(*) from book_ext;' 2>/dev/null)
echo
if [ "${cat_n:-0}" = "${idx_n:-1}" ]; then
  echo "catalogue and index agree: $cat_n books"
else
  echo "MISMATCH: catalogue $cat_n, index $idx_n — a manifest is missing or was overwritten" >&2
  exit 9
fi
