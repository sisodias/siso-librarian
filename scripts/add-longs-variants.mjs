#!/usr/bin/env node
// Make long-s text searchable in modern spelling, without altering a byte of it.
//
// THE PROBLEM. 18th-century printing uses the long s (ſ), and OCR reads it as
// "f". Measured 2026-08-04 across the ingested corpus: 5,846 passages contain
// "fuch" against 6,214 for "such"; 1,964 contain "himfelf" against 1,574 for
// "himself". 20 of 78 books are affected. A reader searching "such" silently
// misses roughly half the matches.
//
// WHY NOT JUST REPLACE f WITH s. I gave that reason without testing it, then
// tested it: the corpus has 35,738 passages containing "from", 5,569 "four",
// 2,599 "full". Blind substitution yields srom, sour, sull — corruption at
// scale. The caveat was right; stating it untested was not.
//
// THE RULE. Convert a word only when the f-form is NOT in the dictionary and
// some s-substitution IS. Multi-f words need a subset search: "firft" requires
// converting the second f only, "himfelf" the second only, "fatisfaction" the
// first only. /usr/share/dict/words (235,976 entries) is the authority, not my
// judgement about which words look archaic.
//
// WHAT IT WRITES. A `body_modern` column in a SEPARATE FTS table. The original
// text is untouched — this is a search aid, not a transliteration. A reader who
// wants the 1742 page gets the 1742 page.
//
//   add-longs-variants.mjs           build the modern-spelling index
//   add-longs-variants.mjs --check   report coverage
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { corpusDb } from './lib/vault-paths.mjs';

const DB = corpusDb();
const DICT = '/usr/share/dict/words';
const check = process.argv.includes('--check');
// SQL goes on STDIN, not argv. Measured 2026-08-04: a 2,000-row insert of full
// passage bodies exceeded the argv limit and threw E2BIG. Piping has no such
// ceiling, so batch size becomes a memory choice rather than a hard limit.
const sq = (sql, db = DB) => execFileSync('sqlite3', [db], { input: sql, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 }).trim();

if (!existsSync(DB)) { console.error(`index missing (vault mounted?): ${DB}`); process.exit(70); }

if (check) {
  const has = sq("select count(*) from sqlite_master where name='passage_modern';");
  if (has === '0') { console.error('no modern index yet'); process.exit(70); }
  console.log(sq(`select 'rows', count(*) from passage_modern
    union all select 'differs_from_original', count(*) from passage_modern where changed = 1;`));
  process.exit(0);
}

if (!existsSync(DICT)) { console.error(`no dictionary at ${DICT} — refusing to guess at word validity`); process.exit(70); }
const words = new Set(readFileSync(DICT, 'utf8').split('\n').map((w) => w.trim().toLowerCase()).filter(Boolean));
console.error(`dictionary: ${words.size.toLocaleString()} entries`);

// Try every subset of f-positions, largest first, and take the first that
// yields a real word. Capped at 3 f's: beyond that the combinatorics stop being
// worth it and the word is probably OCR noise rather than long-s.
function unlongs(w) {
  const lw = w.toLowerCase();
  if (words.has(lw) || !lw.includes('f')) return null;
  const pos = [];
  for (let i = 0; i < lw.length; i += 1) if (lw[i] === 'f') pos.push(i);
  if (!pos.length || pos.length > 3) return null;
  for (let r = pos.length; r >= 1; r -= 1) {
    for (const combo of combinations(pos, r)) {
      const cand = [...lw].map((c, i) => (combo.includes(i) ? 's' : c)).join('');
      if (words.has(cand)) return cand;
    }
  }
  return null;
}
function* combinations(arr, r) {
  if (r === 0) { yield []; return; }
  for (let i = 0; i <= arr.length - r; i += 1) {
    for (const rest of combinations(arr.slice(i + 1), r - 1)) yield [arr[i], ...rest];
  }
}

const cache = new Map();
function modernise(text) {
  let changed = false;
  const out = text.replace(/\b[A-Za-z]*f[A-Za-z]*\b/g, (w) => {
    if (!cache.has(w)) cache.set(w, unlongs(w));
    const m = cache.get(w);
    if (!m) return w;
    changed = true;
    // Preserve the original capitalisation shape.
    return w[0] === w[0].toUpperCase() ? m[0].toUpperCase() + m.slice(1) : m;
  });
  return { out, changed };
}

sq(`drop table if exists passage_modern;
CREATE VIRTUAL TABLE passage_modern USING fts5(
  ext_id UNINDEXED, seq UNINDEXED, changed UNINDEXED, body_modern,
  tokenize = 'unicode61 remove_diacritics 2');`);

const total = Number(sq('select count(*) from passage_ext;'));
console.error(`modernising ${total.toLocaleString()} passages`);
const esc = (s) => `'${String(s).replace(/'/g, "''")}'`;
let done = 0;
let changedCount = 0;

for (let off = 0; off < total; off += 2000) {
  // JSON, not a delimited line format. Passage bodies contain embedded newlines,
  // so splitting sqlite output on '\n' shreds one row into fragments and emits
  // malformed SQL — the same defect that broke 40 titles into 154 pieces earlier
  // today. json_group_array makes sqlite responsible for its own escaping.
  const rows = JSON.parse(sq(`select json_group_array(json_array(ext_id, seq, body))
    from (select ext_id, seq, body from passage_ext_search limit 2000 offset ${off});`) || '[]');
  const vals = [];
  for (const [id, seq, body] of rows) {
    const { out, changed } = modernise(String(body ?? ''));
    if (changed) changedCount += 1;
    vals.push(`(${esc(id)},${seq},${changed ? 1 : 0},${esc(out)})`);
  }
  if (vals.length) sq(`insert into passage_modern values ${vals.join(',')};`);
  done += rows.length;
  if (off % 20000 === 0) console.error(`  ${done.toLocaleString()}/${total.toLocaleString()}`);
}

console.error(`\n${done.toLocaleString()} passages indexed, ${changedCount.toLocaleString()} contained long-s spellings`);
console.error(`distinct words converted: ${[...cache.values()].filter(Boolean).length.toLocaleString()}`);
