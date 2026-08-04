#!/usr/bin/env node
// Check IA want-list candidates against the corpus the Library already holds.
//
// Excluding `*gut` identifiers catches obvious Gutenberg mirrors, but an IA
// copy of a Gutenberg text under any other identifier passes straight through.
// This adds an author-level check: if IA metadata names a creator the Library
// already holds book edges for, the candidate is flagged for review rather
// than silently ingested.
//
// Author matching is deliberately conservative — it flags for review, it does
// not reject. Two writers can share a surname, and a prolific author having one
// work in Gutenberg does not mean IA's copy of a different work is a duplicate.
// The Library has no titles on its book edges, so title matching is unavailable
// and this is the strongest signal on disk.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const GRAPH = `${process.env.HOME}/foundry-data/domains/people/people_v2.sqlite`;
const WANT = 'sources/internet-archive/want-list.json';

function normalise(name) {
  return String(name || '')
    .toLowerCase()
    // Keep parenthetical CONTENT, drop only the brackets. Discarding it lost
    // the given name entirely — 'Oliphant, Mrs. (Margaret)' collapsed to
    // 'oliphant' and stopped matching 'Margaret Oliphant'.
    .replace(/[()]/g, ' ')
    .replace(/\b\d{4}\b/g, ' ')        // drop life years
    .replace(/[^a-z\s,]/g, ' ')
    // honorifics defeat the match: 'Mrs.' has no counterpart in 'Margaret Oliphant'
    .replace(/\b(mrs|mr|ms|miss|dr|sir|lady|rev|prof|st)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// "Twain, Mark" and "Mark Twain" must compare equal
function keyOf(name) {
  const n = normalise(name);
  if (!n) return '';
  const parts = n.includes(',') ? n.split(',').map((s) => s.trim()) : n.split(' ');
  return parts.filter(Boolean).sort().join(' ');
}

if (!existsSync(GRAPH)) { console.error('people graph not present'); process.exit(1); }
if (!existsSync(WANT)) { console.error('want-list not present'); process.exit(1); }

const rows = execFileSync('sqlite3', [`file:${GRAPH}?mode=ro`,
  "select distinct p.name from person p join person_content c using(person_id) where c.domain='book';"],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\n').filter(Boolean);

const held = new Map();
for (const name of rows) {
  const k = keyOf(name);
  if (k) held.set(k, name);
}

const want = JSON.parse(readFileSync(WANT, 'utf8'));
const results = [];

for (const item of want.items) {
  const url = `https://archive.org/metadata/${encodeURIComponent(item.identifier)}`;
  let creators = [];
  try {
    const raw = execFileSync('curl', ['-sS', '--max-time', '25', url], { encoding: 'utf8' });
    const meta = JSON.parse(raw).metadata || {};
    creators = [].concat(meta.creator || []).filter(Boolean);
  } catch { /* unreachable metadata is reported below, not silently dropped */ }

  const matches = creators
    .map((c) => ({ creator: c, key: keyOf(c) }))
    .filter((c) => c.key && held.has(c.key))
    .map((c) => ({ ia_creator: c.creator, library_holds: held.get(c.key) }));

  results.push({
    identifier: item.identifier,
    title: item.title,
    ia_creators: creators,
    author_matches: matches,
    verdict: creators.length === 0 ? 'no_creator_metadata'
      : matches.length ? 'review_possible_duplicate' : 'distinct_author',
  });
}

const summary = {
  checked: results.length,
  distinct_author: results.filter((r) => r.verdict === 'distinct_author').length,
  review_possible_duplicate: results.filter((r) => r.verdict === 'review_possible_duplicate').length,
  no_creator_metadata: results.filter((r) => r.verdict === 'no_creator_metadata').length,
  library_authors_indexed: held.size,
  results,
};
writeFileSync('metrics/2026-08-04-ia-dedup-check.json', JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({ ...summary, results: undefined }, null, 2));
