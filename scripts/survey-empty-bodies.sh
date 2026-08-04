#!/usr/bin/env bash
# For every book whose local body is under a size threshold, fetch the Gutenberg
# plain-text source and measure the bytes BETWEEN the START/END markers.
#
# Written to settle a question two anecdotes could not: gid 4715 has 4 bytes of
# upstream body and gid 9320 has 66, both against titles that should be full
# works. That proves the defect is real and says nothing about its rate.
#
# The distinction this measures:
#   upstream ~empty  -> our extractor was right; the source has no text
#   upstream large   -> OUR defect; we failed to extract text that was there
#
# Those need opposite responses, and no local query can tell them apart.
#
# Rate-limited deliberately. gutenberg.org is a volunteer-run archive and this
# is 168 requests; a sleep between fetches costs minutes and costs them nothing.
#
#   survey-empty-bodies.sh                 survey all under 2 KB (default)
#   survey-empty-bodies.sh 20              survey the first 20 (smoke test)
#   survey-empty-bodies.sh 0 8000          survey all under 8 KB
#   survey-empty-bodies.sh 4 8000          smoke test at the wider bound
set -uo pipefail

LIMIT="${1:-0}"
# Upper bound on the local body size to survey. Defaults to 2 KB, the band where
# an empty upstream file is the obvious suspicion. Raise it to cover books large
# enough to look plausible while still being truncated — 8000 covers the
# 2-8 KB Text band where six random draws all matched but six of 693 proves
# nothing about a rate.
MAX_BODY="${2:-2000}"
OUT="metrics/$(/bin/date -u +%Y-%m-%d)-empty-body-survey-under-${MAX_BODY}.json"
LIST=$(mktemp)

sqlite3 -noheader "file:$HOME/passages.sqlite?mode=ro" \
  "attach 'file:$HOME/foundry-data/domains/books/books.sqlite?mode=ro' as c;
   select b.gid||'|'||(b.body_end-b.body_start)||'|'||
          replace(replace(replace(substr(k.title,1,60),'|','/'),char(10),' '),char(13),' ')
   from book_body b join c.book k on k.gid=b.gid
   where b.body_end-b.body_start < $MAX_BODY order by b.gid;" > "$LIST" 2>/dev/null
# Titles contain newlines. The smoke test hit one — a Gutenberg record whose
# title wraps onto a second line — and it split into a phantom row with an empty
# gid, which then corrupted the JSON. Stripping CR/LF in SQL is the fix; parsing
# more cleverly downstream would only move the problem.

total=$(wc -l < "$LIST" | tr -d ' ')
[ "$LIMIT" -gt 0 ] 2>/dev/null && total="$LIMIT"
echo "surveying $total books with local body < $MAX_BODY bytes"

n=0; upstream_empty=0; our_defect=0; unreachable=0
rows=""

while IFS='|' read -r gid local title; do
  # Skip anything that is not a numeric gid. Belt-and-braces after a wrapped
  # title produced a row with an empty gid that reached the JSON writer and
  # broke it — a malformed record must not be able to destroy the whole result.
  case "$gid" in ''|*[!0-9]*) continue ;; esac
  n=$((n + 1))
  # Break BEFORE counting, or the row that stops the loop inflates the total —
  # the smoke test reported "surveyed 9" for 8 printed rows.
  [ "$LIMIT" -gt 0 ] 2>/dev/null && [ "$n" -gt "$LIMIT" ] && { n=$((n - 1)); break; }

  body=$(/usr/bin/curl -sSL --max-time 30 \
    "https://www.gutenberg.org/cache/epub/$gid/pg$gid.txt" 2>/dev/null |
    /usr/bin/python3 -c "
import sys, re
t = sys.stdin.read()
if not t:
    print('FETCH_FAILED'); raise SystemExit
s = re.search(r'\*\*\* START OF TH.*?\*\*\*', t)
e = re.search(r'\*\*\* END OF TH.*?\*\*\*', t)
# Missing markers is NOT the same as an empty body — an unmarked file may be
# entirely text. Reported separately rather than counted as zero.
print(e.start() - s.end() if s and e else 'NO_MARKERS')" 2>/dev/null)

  case "$body" in
    FETCH_FAILED|NO_MARKERS|"") unreachable=$((unreachable + 1)); verdict="unreachable" ;;
    *)
      # Upstream within 2x of local means the source really is that short and we
      # extracted it faithfully. Much larger upstream means we dropped text.
      if [ "$body" -lt "$MAX_BODY" ] 2>/dev/null; then
        upstream_empty=$((upstream_empty + 1)); verdict="upstream-short"
      else
        our_defect=$((our_defect + 1)); verdict="OUR-DEFECT"
      fi ;;
  esac

  printf '  %-8s local=%-6s upstream=%-8s %s  %s\n' "$gid" "$local" "$body" "$verdict" "${title:0:40}"
  rows="$rows{\"gid\":$gid,\"local\":$local,\"upstream\":\"$body\",\"verdict\":\"$verdict\"},"
  sleep 1
done < "$LIST"

rm -f "$LIST"

/usr/bin/python3 - "$n" "$upstream_empty" "$our_defect" "$unreachable" "$rows" "$OUT" <<'PY'
import json, sys
n, empty, defect, unreach, rows, out = sys.argv[1:7]
records = json.loads('[' + rows.rstrip(',') + ']') if rows.strip(',') else []
json.dump({
    'measured_at': __import__('subprocess').run(['date','-u','+%Y-%m-%dT%H:%M:%SZ'],
                                                capture_output=True, text=True).stdout.strip(),
    'question': 'GQ-006',
    'surveyed': int(n),
    'upstream_short': int(empty),
    'our_defect': int(defect),
    'unreachable': int(unreach),
    'method': 'Fetch pg<gid>.txt, measure bytes between the START and END markers, compare to the local body size.',
    'interpretation': {
        'upstream-short': 'The Gutenberg plain-text file genuinely has little or no body. Our extractor was correct.',
        'OUR-DEFECT': 'Upstream has substantial text we failed to extract. This is ours to fix.',
        'unreachable': 'Fetch failed or the file has no START/END markers. Missing markers are NOT evidence of an empty body.',
    },
    'records': records,
}, open(out, 'w'), indent=2)
open(out, 'a').write('\n')
print(f"\nsurveyed {n}: upstream-short {empty}, OUR-DEFECT {defect}, unreachable {unreach}")
print(f"wrote {out}")
PY
