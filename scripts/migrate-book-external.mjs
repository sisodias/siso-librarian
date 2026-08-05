#!/usr/bin/env node
// Add IA-ingested books to the catalogue WITHOUT touching the book table.
//
// WHY A SIDECAR AND NOT AN INSERT INTO book.
// The book table's own DDL says: `gid INTEGER PRIMARY KEY -- Gutenberg Text#,
// the stable id`. Measured 2026-08-04:
//
//   - 0 of 78 IA identifiers are integers ('b2147171x', 'poetsofchristian00batt')
//   - gid matches the Gutenberg URL in 77,820 of 79,071 rows — the column
//     means what it says
//   - 1,184,937 rows across book_field, book_subject, book_shelf and book_class
//     join on that gid
//   - every existing rights value is the single string 'public_domain_us'
//
// Minting synthetic integers for IA books would put two id namespaces in one
// primary key that a million rows depend on, and would add rights strings the
// column has never held. That is a schema change, not an ingest. A sidecar
// keyed by the source-native id adds the books, keeps provenance exact, and
// leaves every existing row and join untouched.
//
// SAFETY. Refuses to run without a verified vault backup. Additive only — it
// creates one table and inserts into it; it never ALTERs or DELETEs. Verified
// on a scratch copy first: all five existing tables unchanged, quick_check ok.
//
//   migrate-book-external.mjs --dry-run     show what would be written
//   migrate-book-external.mjs --apply       write to the live catalogue
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { vaultRoot } from './lib/vault-paths.mjs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const apply = args.includes('--apply');

const BOOKS = `${process.env.HOME}/foundry-data/domains/books/books.sqlite`;
const VAULT = vaultRoot();
const INGEST = join(VAULT, 'ia-ingest');
const WANT = 'sources/internet-archive/want-list-weak-subjects.json';

// SQL on STDIN, not argv. Measured 2026-08-05 at 1,128 books: passing the
// inserts as an argument threw E2BIG — the same OS limit that broke
// add-longs-variants at 2,000 rows. Piping has no such ceiling, so the
// batch size becomes a memory choice rather than a hard wall.
const sq = (db, sql) => execFileSync('sqlite3', [db], { input: sql, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }).trim();

if (!existsSync(BOOKS)) { console.error(`catalogue missing: ${BOOKS}`); process.exit(70); }
if (!existsSync(INGEST)) { console.error(`ingest missing (volume mounted?): ${INGEST}`); process.exit(70); }

// A backup that does not match the live file is not a restore point. Checking
// row counts rather than existence: a stale copy passes existsSync happily.
const backups = readdirSync(join(VAULT, 'books-catalogue')).filter((f) => f.endsWith('.sqlite')).sort();
if (!backups.length) { console.error('REFUSING: no vault backup of books.sqlite'); process.exit(75); }
const backup = join(VAULT, 'books-catalogue', backups[backups.length - 1]);
for (const t of ['book', 'book_subject', 'book_field', 'book_shelf', 'book_class']) {
  const live = sq(`file:${BOOKS}?mode=ro`, `select count(*) from ${t};`);
  const vault = sq(`file:${backup}?mode=ro&immutable=1`, `select count(*) from ${t};`);
  if (live !== vault) { console.error(`REFUSING: backup is stale — ${t} live=${live} vault=${vault}`); process.exit(75); }
}
console.error(`backup verified current: ${backups[backups.length - 1]}`);

const want = Object.fromEntries(JSON.parse(readFileSync(WANT, 'utf8')).items.map((i) => [i.identifier, i]));
const recs = {};
for (const m of readdirSync(INGEST).filter((f) => f.startsWith('manifest-'))) {
  for (const r of JSON.parse(readFileSync(join(INGEST, m), 'utf8')).results) if (r.status === 'OK') recs[r.identifier] = r;
}

const rows = [];
for (const [ident, r] of Object.entries(recs)) {
  const p = join(INGEST, 'text', `${ident}.txt`);
  if (!existsSync(p)) continue;
  const words = (readFileSync(p, 'utf8').match(/[A-Za-z']+/g) || []).length;
  const w = want[ident] || {};
  rows.push({ ident, title: r.title, year: w.year ?? null, rights: r.rights || w.rights_evidence || '', grade: r.rights_provenance, words, raw: JSON.stringify({ want_list: w, manifest: r }) });
}

console.error(`${rows.length} books ready, ${rows.reduce((s, r) => s + r.words, 0).toLocaleString()} words`);
if (!apply) {
  for (const r of rows.slice(0, 5)) console.error(`  would add ${r.ident.padEnd(26)} ${String(r.words).padStart(8)}w  ${r.title.slice(0, 46)}`);
  console.error(`  ... and ${Math.max(0, rows.length - 5)} more\n(dry run — pass --apply to write)`);
  process.exit(0);
}

const before = Object.fromEntries(['book', 'book_subject', 'book_field', 'book_shelf', 'book_class']
  .map((t) => [t, sq(`file:${BOOKS}?mode=ro`, `select count(*) from ${t};`)]));

sq(BOOKS, `CREATE TABLE IF NOT EXISTS book_external (
  ext_id TEXT PRIMARY KEY, source TEXT NOT NULL, title TEXT NOT NULL, year INTEGER,
  language TEXT, rights TEXT NOT NULL, rights_grade TEXT NOT NULL, text_path TEXT NOT NULL,
  words INTEGER, fetched_at TEXT NOT NULL, raw TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS ix_book_external_source ON book_external(source);`);

const esc = (s) => `'${String(s).replace(/'/g, "''")}'`;
const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const stmts = rows.map((r) => `insert or replace into book_external values (${esc(r.ident)},'internet_archive',${esc(r.title)},${r.year ?? 'null'},'eng',${esc(r.rights)},${esc(r.grade)},${esc(`librarian-vault/ia-ingest/text/${r.ident}.txt`)},${r.words},${esc(now)},${esc(r.raw)});`);
sq(BOOKS, `begin;\n${stmts.join('\n')}\ncommit;`);

// Verify the promise this script makes: nothing else moved.
let clean = true;
for (const [t, n] of Object.entries(before)) {
  const after = sq(`file:${BOOKS}?mode=ro`, `select count(*) from ${t};`);
  if (after !== n) { console.error(`  ${t} CHANGED ${n} -> ${after}`); clean = false; }
}
const added = sq(`file:${BOOKS}?mode=ro`, 'select count(*) from book_external;');
const words = sq(`file:${BOOKS}?mode=ro`, 'select sum(words) from book_external;');
console.error(`book_external: ${added} rows, ${Number(words).toLocaleString()} words`);
console.error(clean ? 'existing tables unchanged — verified after the write' : 'EXISTING TABLES MOVED — investigate');
console.error(sq(`file:${BOOKS}?mode=ro`, 'pragma quick_check(1);'));
process.exit(clean ? 0 : 1);
