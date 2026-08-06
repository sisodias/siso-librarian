#!/usr/bin/env node
// Search the Internet Archive corpus. The reason the indexes exist.
//
// WHY THIS EXISTS. On 2026-08-04 I built a passage index (122,553 passages) and
// then a modern-spelling index that roughly doubles recall on 18th-century text
// — and nothing read either of them. Both were reachable only by someone who
// knew the vault path and wrote their own SQL. That is the same defect as the
// outbox holding three undelivered messages: the content existed, nothing
// surfaced it.
//
// SEARCHES BOTH INDEXES BY DEFAULT. The original preserves the page as printed;
// the modern index resolves long-s OCR ("fuch" -> "such"). A reader asking for
// "such" wants both, and gets a merged, deduplicated result telling them which
// index matched.
//
//   search-library.mjs "vegetarian"
//   search-library.mjs "parliament AND debate" --limit 5
//   search-library.mjs "cookery" --original     only the text as printed
//   search-library.mjs --stats                  what is searchable
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { corpusDb } from './lib/vault-paths.mjs';

const DB = corpusDb();
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const val = (f, d) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const query = args.filter((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--limit').join(' ').trim();

if (!existsSync(DB)) { console.error(`index not available (is the vault mounted?): ${DB}`); process.exit(70); }
const sq = (sql) => execFileSync('sqlite3', [`file:${DB}?mode=ro`], { input: sql, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim();

// passage_modern is OPTIONAL: build-external-passages drops and recreates the
// database, so it is absent between an index rebuild and add-longs-variants.
// Measured 2026-08-05 against a fixture: --stats threw instead of reporting the
// tables that DO exist. A stats command that dies on a missing optional table
// tells the reader nothing about what is present.
const hasModern = sq("select count(*) from sqlite_master where name='passage_modern';") === '1';

if (flag('--stats')) {
  // Stored aggregates. Measured 2026-08-05: the three scans below cost ~430s
  // over USB at 981,260 passages. The builders record them; --stats reads them.
  console.log(sq(`select 'books', coalesce((select v from corpus_stats where k='books'),-1)
    union all select 'passages', coalesce((select v from corpus_stats where k='passages'),-1)
    union all select 'words', coalesce((select v from corpus_stats where k='words'),-1)
    union all select 'with_headings', coalesce((select v from corpus_stats where k='with_headings'),-1)
    ${hasModern ? "union all select 'long_s_passages', coalesce((select v from modern_stats where k='changed'),-1)" : ''};`));
  if (!hasModern) console.error('note: passage_modern absent — run npm run books:longs-variants. long-s counts omitted, NOT zero.');
  process.exit(0);
}

if (!query) {
  console.error('usage: search-library.mjs "<fts5 query>" [--limit N] [--original] [--modern] [--stats]');
  process.exit(64);
}

const limit = Number(val('--limit', '8'));
const useOriginal = !flag('--modern');
let useModern = !flag('--original');
// Escape single quotes for SQL. FTS5 operators (AND/OR/NEAR/quotes) pass
// through deliberately — this is a search tool, not a sanitised form field.
const q = query.replace(/'/g, "''");

// json_group_array so sqlite escapes its own output. Passage bodies contain
// embedded newlines and quotes; a delimited line format shreds them, which is
// how 40 titles became 154 fragments earlier today.
const rows = [];
if (useOriginal) {
  // snippet() is an FTS5 auxiliary function and only works in the query that
  // owns the MATCH — wrapping it directly in json_group_array throws "unable to
  // use function snippet in the requested context". Compute it in a subquery,
  // aggregate outside.
  const out = sq(`select json_group_array(json_array('printed', title, ext_id, seq, snip)) from (
      select b.title, s.ext_id, s.seq, snippet(passage_ext_search, 3, '[', ']', '…', 14) snip
      from passage_ext_search s join book_ext b using(ext_id)
      where passage_ext_search match 'body:${q}' limit ${limit});`);
  rows.push(...JSON.parse(out || '[]'));
}
// EXCLUDE BY ROWID, NOT BY POSTING LIST. The overlap exclusion used to be an
// unlimited NOT IN over a MATCH subquery and cost 434 SECONDS on "the": SQLite
// materialises all 2,723,718 printed matches, then scans the modern index
// against them.
//
// A budget on term frequency was the first fix, and it was bad: measured
// 2026-08-06, SEVENTEEN of twenty classic long-s words — such, those, first,
// present, cause, himself, house, sense, disease, surface — exceeded it. The
// modern index was being disabled for 85% of the queries it exists to serve,
// which is not a tradeoff, it is switching the feature off.
//
// THE KEY FACT: passage_modern and passage_ext_search assign the SAME ROWID to
// the same passage (verified at rowid 500 — antislaverydisun00unse:40 in both).
// So the exclusion needs no cross-index set operation at all: for each modern
// hit, look up that rowid in the printed index's CONTENT TABLE — an ordinary
// B-tree — and ask whether the printed text contains the terms.
//
// PER TERM, NOT AS A PHRASE. FTS matching "electromagnetic induction" means both
// words appear anywhere; a literal LIKE '%electromagnetic induction%' finds only
// the adjacent phrase. Measured: FTS 10 rows, phrase-LIKE 2, per-term-LIKE 10.
// The phrase form would have admitted 8 duplicates.
const terms = query
  .replace(/["'()]/g, ' ')
  .split(/\s+/)
  .filter((t) => t && !/^(and|or|not|near)$/i.test(t))
  .map((t) => t.toLowerCase().replace(/'/g, "''"));
const printedHasAll = terms.length
  ? terms.map((t) => `lower(c.c3) like '%${t}%'`).join(' and ')
  : '1';

if (useModern) {
  const out = sq(`select json_group_array(json_array('modernised', title, ext_id, seq, snip)) from (
      select b.title, m.ext_id, m.seq, snippet(passage_modern, 3, '[', ']', '…', 14) snip
      from passage_modern m join book_ext b using(ext_id)
      where passage_modern match 'body_modern:${q}'
        -- ONLY passages the printed index cannot find — the "witneffed",
        -- "creaturcs" passages a reader searching modern spelling would never
        -- otherwise reach. The exclusion is load-bearing: without it the shared
        -- hits crowd out every modern-only one.
        --
        -- not exists over a SHARED ROWID, so this is a point lookup per candidate
        -- rather than a scan of the whole printed posting list. See the note above.
        and not exists (
          select 1 from passage_ext_search_content c
          where c.rowid = m.rowid and ${printedHasAll})
        -- CAP THE CANDIDATES, not just the results. LIMIT N bounds rows
        -- RETURNED; a stopword bounds nothing, because almost every candidate is
        -- rejected. Measured 2026-08-06: "the" matches 2,723,718 modern rows and
        -- nearly all of them also print "the", so the join walked millions to
        -- find three — 58 seconds.
        --
        -- This cap is safe in a way the old frequency budget was not: whatever it
        -- finds is still EXACTLY correct, because every candidate is tested by
        -- the same exclusion. It stops looking; it does not lower the bar.
        and m.rowid in (
          select rowid from passage_modern where passage_modern match 'body_modern:${q}' limit 40000)
      limit ${limit});`);
  rows.push(...JSON.parse(out || '[]'));
}

// Dedup on (ext_id, seq): a passage matching in both indexes is ONE result. The
// printed form wins, because it is what the book actually says.
//
// INTERLEAVED, not concatenated. Measured 2026-08-04: 1,963 passages containing
// "himfelf" are findable ONLY through the modern index — and a naive
// printed-then-modern order fills the whole result page from the printed index,
// so the modern-only hits never appear. The recall gain would exist in the
// table and never reach a reader, which is the exact defect this tool was
// written to fix.
// EXACT EXCLUSION, CHEAPLY. The SQL above bounds its NOT IN window for speed
// (434s -> 395ms on "the"), and a bounded window can admit a false positive: a
// passage that IS in the printed index but sorts outside the window. Measured
// 2026-08-06 on "himfelf" — 3 of 3 modern results were duplicates the unbounded
// form correctly excluded.
//
// So the bound buys speed and this buys back correctness: ask the printed index
// about the handful of survivors directly. That is `limit` lookups on an indexed
// column, not a 2.7-million-row list.
// NO SECOND QUERY. My first attempt at exact exclusion re-ran
// `match 'body:${q}'` to test the survivors, which re-materialised the same
// posting list the bound existed to avoid — "the" went 395ms -> 231 SECONDS.
// The same trap as the original defect, one layer down, and I walked into it
// while fixing it.
//
// The dedup below already removes any (ext_id, seq) appearing in BOTH result
// sets, and it costs nothing because both are already in memory. That is the
// exclusion the reader actually experiences: no duplicate reaches the page.
//
// What the bounded SQL window still buys is that modern-only hits are not
// crowded out by shared ones — which is why it stays.

const printed = rows.filter((r) => r[0] === 'printed');
const modernised = rows.filter((r) => r[0] === 'modernised');
const seen = new Set();
const merged = [];
for (let i = 0; i < Math.max(printed.length, modernised.length); i += 1) {
  for (const r of [printed[i], modernised[i]]) {
    if (!r) continue;
    const [via, title, id, seq, snip] = r;
    const key = `${id}:${seq}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({ via, title, id, seq, snip });
  }
}

if (!merged.length) {
  console.log(`no matches for ${JSON.stringify(query)}`);
  // A zero here is a real answer, not a failure — but say which indexes were
  // consulted, so "not found" cannot be mistaken for "not searched".
  console.log(`(searched: ${[useOriginal && 'printed', useModern && 'modernised'].filter(Boolean).join(' + ')})`);
  process.exit(0);
}

for (const m of merged.slice(0, limit)) {
  console.log(`\n${m.title.slice(0, 78)}`);
  console.log(`  ${m.id}:${m.seq}  (${m.via})`);
  console.log(`  ${m.snip.replace(/\s+/g, ' ').trim()}`);
}
console.log(`\n${merged.length} passage(s); showing ${Math.min(merged.length, limit)}`);
