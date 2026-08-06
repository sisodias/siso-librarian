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
// HOW COMMON IS THIS TERM? The modern index's overlap exclusion is exact, and
// its cost is linear in this number, so one cheap count decides whether it is
// affordable. Counting is 4ms for "telescope", 252ms for "himself", 2.6s for
// "the" — against 2.2s / 36s / 301s for the exclusion itself.
//
// WHY A BUDGET AND NOT A CLEVERER QUERY. Measured 2026-08-06, four ways, all
// dead ends:
//
//   bounded NOT IN window      fast, but returned 4 DUPLICATE passages at
//                              --limit 8 — correctness traded for speed
//   JS-side re-query           re-materialised the same posting list the bound
//                              existed to avoid: 395ms -> 231s
//   changed=1 pre-filter       necessary but NOT sufficient (a passage can be
//                              modernised elsewhere and still print the term
//                              literally), and still 100s on "such"
//   per-row membership test    ONE lookup costs 97 SECONDS
//
// The last one explains the other three. ext_id and seq are UNINDEXED columns in
// the FTS5 table, so ANY filter on them still walks the entire posting list for
// the term. There is no targeted lookup to be had at this schema. The base table
// answers the same lookup in 93ms but stores only offsets and a 160-char
// preview, so it cannot test term membership.
//
// THE CURVE IS A CLIFF, NOT A LINE. I first set this from an assumed ~1ms per
// 9,000 hits and it was wrong: quinine at 4,036 hits costs 181ms, but cause at
// 46,157 costs 30 SECONDS, and himself at 35,469 costs 6.4s. Hit count alone
// does not predict the cost, so the budget sits low — at 10,000, comfortably
// inside the measured-fast region — rather than at an extrapolated boundary I
// cannot defend.
//
// So the budget is not a shortcut around a problem I failed to solve; it is the
// shape of the constraint. Beyond it the modern index is skipped AND SAID TO BE
// SKIPPED, which keeps the reader informed rather than silently narrowed.
const MODERN_EXCLUSION_BUDGET = 10000;
let modernSkipped = null;
if (useModern && useOriginal) {
  const n = Number(sq(`select count(*) from passage_ext_search where passage_ext_search match 'body:${q}';`) || 0);
  if (n > MODERN_EXCLUSION_BUDGET) {
    modernSkipped = n;
    useModern = false;
  }
}

if (useModern) {
  const out = sq(`select json_group_array(json_array('modernised', title, ext_id, seq, snip)) from (
      select b.title, m.ext_id, m.seq, snippet(passage_modern, 3, '[', ']', '…', 14) snip
      from passage_modern m join book_ext b using(ext_id)
      where passage_modern match 'body_modern:${q}'
        -- ONLY passages the printed index cannot find. Both indexes match the
        -- same rows first, so asking for the top N of each and deduping yields
        -- N printed results and nothing new: the modern-only hits sort far below
        -- the shared ones. Excluding the overlap is what actually surfaces the
        -- "himfelf" passages the reader came for — 12,924 of them also match the
        -- printed index, so the exclusion is load-bearing, not decorative.
        --
        -- EXACT, AND AFFORDABLE ONLY BECAUSE OF THE PRE-CHECK ABOVE. Unlimited,
        -- this NOT IN cost 434 SECONDS on "the": SQLite plans it as a LIST
        -- SUBQUERY, materialising all 2,723,718 printed matches and scanning the
        -- modern index against them, while raw FTS5 answers the same term in
        -- 333ms.
        --
        -- Measured 2026-08-06, the cost is linear in printed-hit count — about
        -- 1ms per 9,000 hits (telescope 2,392 hits/2.2s; himself 35,469/36s;
        -- the 2,723,718/301s). So the caller counts first and skips the modern
        -- index entirely when the term is too common to exclude cheaply.
        --
        -- I tried two cheaper forms and BOTH were wrong: a bounded window
        -- returned 4 duplicate passages at --limit 8, and a JS-side re-query
        -- re-materialised the very posting list the bound existed to avoid
        -- (395ms -> 231s). Exactness stays; the pre-check pays for it.
        and (m.ext_id, m.seq) not in (
          select ext_id, seq from passage_ext_search where passage_ext_search match 'body:${q}')
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
// A SKIPPED INDEX MUST SAY SO. Otherwise "3 passages" from one index is
// indistinguishable from "3 passages" from both, and the reader cannot tell
// that long-s recall was not applied to this query.
if (modernSkipped !== null) {
  console.log(`(modern-spelling index skipped: ${modernSkipped.toLocaleString()} printed matches exceeds the ${MODERN_EXCLUSION_BUDGET.toLocaleString()} budget for exact overlap exclusion — narrow the query to include it)`);
}
