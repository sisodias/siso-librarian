#!/usr/bin/env node
// Generate an Internet Archive want-list from subjects the Library is WEAK in,
// deduped against titles it already holds.
//
// This closes a gap I named four loops running without building: the census
// found 128 new books across six subjects, and the want-list contract takes
// named identifiers, so nothing connected the finding to the ingest path.
//
// WHY WEAK SUBJECTS. Measured 2026-08-04, novelty tracks how much of a subject
// the Library already has — inversely:
//
//   Science fiction   3,291 held   462 checked    4 new   0.9%
//   English poetry      232 held    92 checked   38 new  41.3%
//
// Both corpora draw on Gutenberg, so they converge exactly where Gutenberg is
// deep. To find books the Library lacks, aim at what it lacks.
//
// The rights gate is unchanged: only items whose IA metadata carries an explicit
// rights:"public domain" field, excluding the controlled-lending collections.
// No rights judgement is made here — IA's determination is used as-is.
//
//   build-want-list.mjs "English poetry" "Essays"      preview
//   build-want-list.mjs --write "English poetry" ...   write the want-list
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { normaliseTitle } from './ia-title-dedup.mjs';

const args = process.argv.slice(2);
const write = args.includes('--write');
const subjects = args.filter((a) => a !== '--write');
if (!subjects.length) {
  console.error('usage: build-want-list.mjs [--write] "<subject>" ["<subject>" ...]');
  process.exit(64);
}

const BOOKS = `${process.env.HOME}/foundry-data/domains/books/books.sqlite`;
const held = new Set(
  execFileSync('sqlite3', [`file:${BOOKS}?mode=ro`,
    // UNION book_external. The catalogue gained a second source on 2026-08-04
    // (78 Internet Archive books) and this query read `book` only — so the very
    // next want-list would have re-offered all 78 and refetched every one of
    // them. A dedup query that knows about one of two sources is worse than no
    // dedup, because it reports "new" with confidence.
    'select replace(replace(title, char(10), " "), char(13), " ") from book where title is not null'
    + ' union all select replace(replace(title, char(10), " "), char(13), " ") from book_external where title is not null;'],
    { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 })
    .split('\n').filter(Boolean).map(normaliseTitle).filter(Boolean));

const RIGHTS = 'rights:"public domain"';
const EXCLUDE = 'NOT collection:printdisabled NOT collection:inlibrary';

// Paginated. A single query caps out and silently truncates the pool — the
// science-fiction census needed three pages for 535 results, and taking page 1
// alone would have measured 200 of them while reporting a rate for all.
async function fetchSubject(subject) {
  const q = `mediatype:texts AND ${RIGHTS} AND language:eng AND subject:"${subject}" ${EXCLUDE}`;
  const docs = [];
  for (let page = 1; page <= 10; page += 1) {
    const url = 'https://archive.org/advancedsearch.php?q=' + encodeURIComponent(q)
      + `&rows=200&page=${page}&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=year&fl%5B%5D=language&fl%5B%5D=rights&output=json`;
    let batch = [];
    try {
      const raw = execFileSync('curl', ['-sSL', '--max-time', '60', url], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
      batch = JSON.parse(raw)?.response?.docs || [];
    } catch { break; }
    if (!batch.length) break;
    docs.push(...batch);
    if (batch.length < 200) break;
    execFileSync('sleep', ['1']);   // volunteer-run archive; be patient
  }
  return { q, docs };
}

// Rights evidence is not binary. Measured across 106 items, the field carries
// six distinct strings representing four grades of evidence:
//
//   72  "Creative Commons, Public Domain Mark"      a formal PD designation
//   25  "Public domain in the USA."                 jurisdiction-scoped assertion
//    6  "Copyright review: ... HathiTrust ..."      institutional review, sourced
//    1  "Public Domain"                             bare assertion
//    1  "This work is now in public domain."        bare assertion
//    1  "Public Domain License"                     not a real designation
//
// My first classifier had two buckets and put the CC Public Domain Mark in the
// same bin as free text an uploader typed. These grade differently and a
// consumer should be able to choose a threshold.
// IA's language:eng filter is not reliable. Measured 2026-08-05: six books
// entered the corpus as English and are five German and one Latin — Janus
// (a German medical-history journal) and Freind's Historia medicinae. Every one
// carries `language: eng` in IA's own metadata.
//
// The TITLE gives it away where the metadata does not: "für Geschichte und
// Literärgeschichte", "Zeitschrift", "Johannis Freind medicinae doctoris".
// Tested against all 120 candidates of the third list: catches 6 of 6 with
// ZERO false positives.
//
// Detected HERE, at selection, rather than in corpus-integrity after the
// download. A check that runs after the bytes have moved is a report; a check
// that runs before is a filter.
const GERMAN_TITLE = /\b(für|und|der|die|das|von|zur|des|zeitschrift|geschichte|beiträge|über)\b/gi;
const LATIN_TITLE = /\b(medicinae|doctoris|historia|libri|opera|de|ad|cum|atque|quae)\b/gi;
// Italian, added 2026-08-05 after "Viaggio al Surinam e nell' interno della
// Guiana" reached the corpus — 26.7% English-dictionary hit rate, admitted
// because the filter only knew German and Latin.
//
// TWO markers, measured rather than assumed: a one-marker rule flags 3 of 1,100
// candidates and two of them are ENGLISH — "Sylva sylvarum ... naturall
// historie" and "The travels of Sig. Pietro della Valle", where "della" is part
// of an Italian NAME. Two markers flags exactly the one Italian book.
const ACCENTED = /[\u00e0\u00e2\u00e4\u00e7\u00e9\u00e8\u00ea\u00eb\u00ee\u00ef\u00f4\u00f6\u00f9\u00fb\u00fc\u00f1]/i;
const FRENCH_TITLE = /\b(\u00e0|au|aux|du|des|le|la|les|dans|sur|pour|par|nouvelle|voyage)\b/gi;
const ITALIAN_TITLE = /\b(viaggio|della|delle|nell|degli|dei|sulla|nella|ossia|di|il|lo|gli)\b/gi;

function looksNonEnglish(title) {
  const t = String(title || '');
  // TWO DISTINCT markers, like every other language rule here. German was the
  // one rule I never tested for false positives, and it showed: measured
  // 2026-08-05 on 2,045 candidates, ONE marker flags 39 and TWO flags 5 — and
  // all five are unambiguously German (Versuche und Beobachtungen über,
  // Beiträge zur gerichtlichen Chemie).
  //
  // The 34 single-marker exclusions were wrong in context:
  //   "von"  — a German NAME particle in "Justus von Liebig : his life and work"
  //   "des"  — FRENCH, in "Système des connaissances chimiques" (32 volumes)
  //
  // A rule tuned on one example excludes good books. I wrote that two turns ago
  // about Italian and left the German rule single-marker.
  if (new Set((t.match(GERMAN_TITLE) || []).map((w) => w.toLowerCase())).size >= 2) return 'german';
  if ((t.match(ITALIAN_TITLE) || []).length >= 2) return 'italian';
  // French needs an ACCENT and THREE markers. Measured 2026-08-05 on 1,100
  // candidates: an accent alone flags 4, three of which are English books using
  // French loanwords — "catalogue raisonné", "in search of La Pérouse". Accent
  // plus two still catches La Pérouse. Accent plus three flags exactly the one
  // French book, "Voyage à la Nouvelle Galles du Sud".
  if (ACCENTED.test(t) && (t.match(FRENCH_TITLE) || []).length >= 3) return 'french';
  // Latin needs TWO markers: "de" and "ad" appear in English titles alone.
  if ((t.match(LATIN_TITLE) || []).length >= 2) return 'latin';
  return null;
}

function classifyRights(s) {
  const r = String(s || '');
  if (/^copyright review/i.test(r)) return 'institutional-review';
  if (/public domain mark/i.test(r)) return 'formal-designation';
  if (/public domain in the (usa|united states)/i.test(r)) return 'jurisdiction-scoped';
  if (/public domain license/i.test(r)) return 'not-a-designation';
  if (/public domain/i.test(r)) return 'bare-assertion';
  return 'none';
}

const items = [];
const seen = new Set();
let gutSkipped = 0;
const nonEnglishSkipped = [];
const perSubject = [];

for (const subject of subjects) {
  const { q, docs } = await fetchSubject(subject);
  let added = 0;
  for (const d of docs) {
    const title = Array.isArray(d.title) ? d.title[0] : d.title;
    const rightsString = String(Array.isArray(d.rights) ? d.rights[0] : (d.rights || '')).slice(0, 120);
    if (!title || !d.identifier) continue;
    const key = normaliseTitle(title);
    // Two dedup passes: against the Library, and against items already added
    // from an earlier subject. A book can carry several subjects.
    // Gutenberg mirrors. IA hosts copies of Gutenberg texts under identifiers
    // ending in "gut", and the Library already ingests Gutenberg wholesale — so
    // these are guaranteed duplicates that TITLE dedup misses, because IA's
    // title differs slightly from Gutenberg's ("Ermeline a ballad" vs
    // "Ermeline: A Ballad").
    //
    // The first want-list excluded these too, but recorded only the COUNT
    // ("gutenberg_mirrors_excluded: 1"), not the rule. An exclusion that lives
    // in someone's head is not inherited by the next generator — measured
    // 2026-08-04: 25 of my 106 candidates were Gutenberg mirrors.
    if (/gut$/.test(d.identifier)) { gutSkipped += 1; continue; }
    const foreign = looksNonEnglish(title);
    if (foreign) { nonEnglishSkipped.push({ identifier: d.identifier, title: String(title).slice(0, 90), looks: foreign }); continue; }
    if (!key || held.has(key) || seen.has(key)) continue;
    seen.add(key);
    added += 1;
    items.push({
      identifier: d.identifier,
      title: String(title).slice(0, 200),
      year: Number(Array.isArray(d.year) ? d.year[0] : d.year) || null,
      language: 'eng',
      tier: `weak-subject:${subject}`,
      // The rights STRING, not merely that the field existed. Measured
      // 2026-08-04: a value beginning "Copyright review:" is an institutional
      // determination (Princeton/HathiTrust); a bare "Public Domain License" on
      // a 2025 upload is free text an uploader typed. The contract treated both
      // as "IA says public domain". They are not the same evidence.
      rights_evidence: rightsString ? `advancedsearch ${RIGHTS}; item rights: ${rightsString}` : `advancedsearch ${RIGHTS}`,
      rights_provenance: classifyRights(rightsString),
      query: q,
    });
  }
  perSubject.push({ subject, fetched: docs.length, new: added });
  console.error(`  ${subject}: ${docs.length} fetched, ${added} new`);
}

const out = {
  schema_version: 'want-list-v1',
  generated_at: new Date().toISOString(),
  supersedes: 'sources/internet-archive/want-list.json',
  rationale: 'Subjects the Library is measurably weak in, deduped by title against the 74,674-title catalogue. '
    + 'Novelty tracks scarcity: science fiction (3,291 held) yields 0.9% new, English poetry (232 held) yields 41.3%.',
  query_totals: perSubject,
  non_english_excluded: { count: nonEnglishSkipped.length, rule: 'title carries German function words, or two or more Latin markers — IA language:eng is unreliable', items: nonEnglishSkipped },
  gutenberg_mirrors_excluded: { count: gutSkipped, rule: 'identifier ends in "gut" — IA-hosted Gutenberg copies, already ingested by the Library' },
  contract: {
    rights: 'IA metadata rights:"public domain" only; no rights judgement made here',
    excluded: 'collection:printdisabled, collection:inlibrary (controlled digital lending)',
    dedup: 'normalised title against books.sqlite, plus cross-subject dedup within this list',
  },
  items,
};

console.error(`\ntotal: ${items.length} candidate identifiers`);
if (write) {
  const path = 'sources/internet-archive/want-list-weak-subjects.json';
  writeFileSync(path, JSON.stringify(out, null, 2) + '\n');
  console.error(`wrote ${path}`);
} else {
  console.error('(preview only — pass --write to save)');
}
