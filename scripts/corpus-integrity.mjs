#!/usr/bin/env node
// Check the ingested corpus for duplication — by title AND by content.
//
// WHY BOTH. The ingest dedups CANDIDATES by normalised title before fetching.
// Nothing had ever verified that worked, and title matching is blind to the
// same text arriving under two different titles — a reprint, a re-issue, a
// volume split across editions.
//
// WHAT A SHARED PASSAGE MEANS. Measured 2026-08-05 across 179 books: 3 shared
// fingerprints, each a single passage, and all three are QUOTATION —
//
//   b21471745 / b21471848_0001    a childcare passage quoted in two Victorian
//                                 domestic-economy manuals
//   johndonnehisflig00molo /      a Donne criticism passage quoted in two works
//   metaphysicallyri00unse        on metaphysical poetry
//
// That is what a library of related works SHOULD contain. This reports shared
// passages; it does not treat them as defects, because deciding that requires
// reading them.
//
//   corpus-integrity.mjs           report
//   corpus-integrity.mjs --strict  exit non-zero on EXACT title duplicates
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

// Overridable so this can be tested against a fixture. A check that can only
// run against the real corpus cannot be proven to detect anything — the same
// defect as a self-test that exercises sqlite instead of the script.
const DB = process.env.CORPUS_DB || '/Volumes/SISO-STORAGE-VAULT/SISO-VAULT/librarian-vault/ia-ingest/external-passages.sqlite';
if (!existsSync(DB)) { console.error(`index unavailable (vault mounted?): ${DB}`); process.exit(70); }
const sq = (sql) => execFileSync('sqlite3', [`file:${DB}?mode=ro`], { input: sql, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 }).trim();

const SEP = String.fromCharCode(31);
const books = Number(sq('select count(*) from book_ext;'));
const exactDupes = JSON.parse(sq(`select json_group_array(json_array(title, n)) from (
  select title, count(*) n from book_ext group by title having n > 1);`) || '[]');

// Fingerprint LONG passages only. Short ones collide on boilerplate — page
// headers, "CHAPTER I" — and would report duplication that is really typography.
const rows = sq("select ext_id || char(31) || replace(replace(preview, char(10), ' '), char(13), ' ') from passage_ext where words > 80;")
  .split('\n').filter((l) => l.includes(SEP));
const byHash = new Map();
for (const line of rows) {
  const [id, ...rest] = line.split(SEP);
  const norm = rest.join(' ').split(/\s+/).join(' ').toLowerCase();
  const h = createHash('md5').update(norm).digest('hex').slice(0, 12);
  if (!byHash.has(h)) byHash.set(h, new Set());
  byHash.get(h).add(id);
}
const shared = [...byHash.entries()]
  .filter(([, s]) => s.size > 1)
  .map(([h, s]) => ({ fingerprint: h, books: [...s] }));

console.log(JSON.stringify({
  books,
  passages_fingerprinted: rows.length,
  exact_title_duplicates: exactDupes.length,
  exact_title_duplicate_detail: exactDupes,
  passages_shared_across_books: shared.length,
  shared_detail: shared.slice(0, 10),
  note: 'Shared passages are reported, not condemned. Across 179 books all three were quotation between related works.',
}, null, 2));

// Only EXACT title duplicates are a failure: those mean the dedup let the same
// book through twice, which is a defect in the ingest rather than a property of
// the corpus.
if (process.argv.includes('--strict') && exactDupes.length) process.exit(5);
