// The rules that decide what enters the corpus, in one testable place.
//
// WHY THIS EXISTS. Measured 2026-08-06: build-want-list.mjs gained two rules in
// one day — an age-based rights upgrade and an archival-correspondence filter —
// and NEITHER could be tested. Both lived inside a script that fetches from the
// Internet Archive at import time, so there was no way to assert their behaviour
// without a network round-trip.
//
// These are the highest-consequence rules in the repo: one decides the RIGHTS
// BASIS on which a book is admitted, the other decides whether an item is a book
// at all. "Cannot be pointed at a fixture" is the defect class that has cost the
// most here, and it had reached the rights layer.
//
// PRECEDENT: lib/vault-paths.mjs after eight hardcoded paths, lib/claim-paths.mjs
// after five claim mis-keys, lib/snapshot-paths.mjs after four snapshot mis-keys.
// Same mechanism, fourth application.

// A work published before 1929 is public domain in the US whatever an uploader
// typed in the rights field.
export const PD_BY_AGE_BEFORE = 1929;

// Upgrades ONLY bare-assertion — a grade that already means "the metadata says
// public domain, with no formal designation behind it". It never promotes
// 'none' (metadata says nothing) or 'not-a-designation' (metadata says something
// that is not a rights grant), because age cannot substitute for evidence that
// was never offered.
//
// Deliberately conservative on missing data: no year means no upgrade.
//
// Measured on the ninth want-list: 538 of 1,076 bare-assertion items were
// pre-1929, ranging 1611-1928. On the eighth list only 15 of 2,761 were — so
// this admits a real population without touching the modern uploads the grade
// exists to catch.
export function ageSettled(year, grade) {
  if (grade !== 'bare-assertion') return grade;
  if (!Number.isFinite(year) || year <= 0) return grade;
  return year < PD_BY_AGE_BEFORE ? 'age-settled' : grade;
}

// Archival correspondence: "Letter(s) to/from ... <year>".
//
// Requires a YEAR, not merely the word "letter". Measured 2026-08-06:
// "Vegetable Growers' News Letter" is a printed periodical and must survive,
// while "William Cheyney Letter to son 1892-05-16" is a handwritten page with no
// usable OCR layer.
//
// Validated against two real manifests: 87 correct skips, 1 miss, and the 13
// apparent false positives were all Cheyney letters that should be skipped too.
// Zero real books excluded.
export const CORRESPONDENCE_TITLE = /\bletters?\s+(to|from)\b.*(\d{4}-\d{2}-\d{2}|\b\d{4}\b)/i;

// KNOWN LIMIT, measured rather than assumed. A published epistolary work titled
// "Letters from an American Farmer 1782" would match this and be skipped. That
// shape does NOT occur in the data: of 121 items the rule excluded on the ninth
// want-list, ZERO have a title beginning "Letters from/to" — every one is the
// archival form, "<Name> Letter to <person> <date>".
//
// So the narrower rule that would fix it (requiring the letter phrase not to
// start the title) is unnecessary today. Recorded here so that if a published
// epistolary work is ever wrongly skipped, the fix is already identified rather
// than rediscovered.
export function isCorrespondence(title) {
  return CORRESPONDENCE_TITLE.test(String(title || ''));
}
