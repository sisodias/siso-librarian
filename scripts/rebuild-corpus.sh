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
DB=/Volumes/SISO-STORAGE-VAULT/SISO-VAULT/librarian-vault/ia-ingest/external-passages.sqlite
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
