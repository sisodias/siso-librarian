#!/usr/bin/env node
// Title-aware dedup for Internet Archive candidates.
//
// Supersedes the author-only check in ia-dedup-check.mjs, which was written on a
// FALSE PREMISE: its comment said "The Library has no titles on its book edges,
// so title matching is unavailable". Measured 2026-08-04 — books.sqlite holds
// 79,071 books with title and authors, keyed on the same `gid` as the passage
// index, and 77,534 of 77,540 book bodies join to a title.
//
// Author-only matching flags "the Library holds something by this person", which
// is far too broad: one Twain work in the corpus would flag every Twain
// candidate. Title matching answers the question actually being asked.
//
// NORMALISATION, and why each rule exists — checked against real titles:
//   "The Adventures of Pinocchio"              leading article
//   "The Notebooks of Leonardo Da Vinci — Complete"   em-dash edition suffix
//   "Vulcan's Workshop"                        apostrophes, case
//
// Deliberately conservative: it FLAGS for review, it does not reject. Two works
// can share a title, and an edition suffix can be meaningful.
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const BOOKS = `${process.env.HOME}/foundry-data/domains/books/books.sqlite`;
if (!existsSync(BOOKS)) { console.error('books catalogue not present'); process.exit(1); }

export function normaliseTitle(t) {
  return String(t || '')
    .toLowerCase()
    // Edition/volume suffixes after an em- or en-dash. "— Complete", "— Vol. II".
    // Cutting at the dash rather than listing suffixes: the set is open-ended and
    // a whitelist would silently miss the next form.
    .split(/[—–]/)[0]
    .replace(/[’']/g, '')          // "Vulcan's" -> "vulcans"
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/^(the|a|an) /, '')   // leading article only; "The Man Who Was Thursday"
    .replace(/\s+/g, ' ')
    .trim();
}

const rows = execFileSync('sqlite3', [`file:${BOOKS}?mode=ro`,
  // UNION book_external. The catalogue gained a second source on 2026-08-04 and
  // this read `book` only, so titles already ingested from the Internet Archive
  // would report as NEW. ext_id stands where gid does; both are opaque here.
  'select gid || "" || replace(replace(title, char(10), " "), char(13), " ") from book where title is not null'
  + ' union all select ext_id || "" || replace(replace(title, char(10), " "), char(13), " ") from book_external where title is not null;'],
  { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 }).split('\n').filter(Boolean);

const held = new Map();
for (const line of rows) {
  const [gid, title] = line.split('');
  const k = normaliseTitle(title);
  if (k && !held.has(k)) held.set(k, { gid, title });
}

const candidates = process.argv.slice(2);
if (!candidates.length) {
  console.log(JSON.stringify({
    library_titles_indexed: held.size,
    usage: 'ia-title-dedup.mjs "<title>" ["<title>" ...]',
    note: 'Pass candidate titles to check them against the Library catalogue.',
  }, null, 2));
  process.exit(0);
}

const results = candidates.map((title) => {
  const k = normaliseTitle(title);
  const hit = held.get(k);
  return {
    candidate: title,
    normalised: k,
    verdict: hit ? 'ALREADY HELD' : 'not held',
    ...(hit ? { library_gid: hit.gid, library_title: hit.title } : {}),
  };
});

console.log(JSON.stringify({
  library_titles_indexed: held.size,
  checked: results.length,
  already_held: results.filter((r) => r.verdict === 'ALREADY HELD').length,
  results,
}, null, 2));
