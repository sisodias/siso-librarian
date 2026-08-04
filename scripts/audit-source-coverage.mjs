#!/usr/bin/env node
// Catch queries that read a NARROWER source than the thing they claim to check.
//
// This defect appeared twice on 2026-08-04 and both times by accident:
//
//   1. The catalogue gained book_external (78 Internet Archive books) and both
//      dedup paths still read `from book` only — so the next want-list would
//      have re-offered all 78 and refetched them from a volunteer-run archive.
//   2. Earlier the same day, `snap.bucket_counts[group][key]` made an entire
//      audit section check nothing while reporting success.
//
// It is the same shape as the wrong-key class in the charter, and it is
// invisible for the same reason: the query SUCCEEDS. No error, no exception, no
// empty result — just a confident answer computed over half the data. A gate
// that only checks for errors will never see it.
//
// THE RULE. When a table has a declared sibling covering the same concept from
// another source, any query naming one must name the other, or carry an
// explicit waiver saying why not.
//
//   audit-source-coverage.mjs           report
//   audit-source-coverage.mjs --strict  exit non-zero on any finding
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const strict = process.argv.includes('--strict');
const root = process.cwd();

// Sibling tables covering one concept across sources. Extend this when a new
// source lands — that act is the point at which the bug becomes possible.
const SIBLINGS = [
  {
    concept: 'the book catalogue',
    tables: ['book', 'book_external'],
    // A query about book_subject/book_field is about Gutenberg-only metadata
    // that book_external genuinely does not have; naming it would be wrong.
    exempt: /book_subject|book_field|book_shelf|book_class|book_body/,
  },
];

const findings = [];
const scriptsDir = join(root, 'scripts');
const files = existsSync(scriptsDir)
  ? readdirSync(scriptsDir).filter((f) => /\.(mjs|js|sh)$/.test(f))
  : [];

for (const f of files) {
  const path = join(scriptsDir, f);
  const text = readFileSync(path, 'utf8');
  // A waiver is a comment naming the sibling and why it is not queried.
  const waived = /SOURCE-COVERAGE-WAIVER/.test(text);
  // Strip comments ONCE and test EVERYTHING against the result. The first
  // version tested `from book` against raw text but the sibling against
  // stripped code, so a comment in gate-selftest.sh reading "still read `from
  // book` alone" was reported as a real query. Prose that discusses SQL is not
  // SQL — and a gate that cries wolf about its own documentation gets muted.
  const code = text
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n').map((l) => l.replace(/(^|\s)(\/\/|#).*$/, ' ')).join('\n');

  for (const sib of SIBLINGS) {
    const [primary, secondary] = sib.tables;
    // Only SQL that actually reads the primary table counts. `from book`
    // followed by a word character is book_subject etc, not book.
    const reads = new RegExp(`\\bfrom\\s+${primary}\\b(?!_)`, 'i');
    if (!reads.test(code)) continue;

    // Strip the lines that are exempt before deciding.
    const lines = code.split('\n').filter((l) => reads.test(l) && !sib.exempt.test(l));
    if (!lines.length) continue;

    if (!new RegExp(`\\b${secondary}\\b`).test(code) && !waived) {
      findings.push({
        kind: 'source-coverage-gap',
        file: `scripts/${f}`,
        concept: sib.concept,
        reads: primary,
        missing: secondary,
        sample: lines[0].trim().slice(0, 120),
        why: `queries ${primary} but never mentions ${secondary}; it would report on one source while claiming to cover ${sib.concept}`,
      });
    }
  }
}

// The gate must be able to fail. If SIBLINGS ever stops matching reality — the
// table renamed, the file moved — this reports zero findings and looks healthy,
// which is the exact failure it exists to prevent. So assert the primary table
// is real before trusting a clean result.
const dbPath = `${process.env.HOME}/foundry-data/domains/books/books.sqlite`;
let sanity = 'skipped (catalogue not present)';
if (existsSync(dbPath)) {
  const { execFileSync } = await import('node:child_process');
  const tables = execFileSync('sqlite3', [`file:${dbPath}?mode=ro`,
    "select name from sqlite_master where type='table';"], { encoding: 'utf8' }).split('\n');
  for (const sib of SIBLINGS) {
    const missing = sib.tables.filter((t) => !tables.includes(t));
    if (missing.length) {
      findings.push({
        kind: 'sibling-table-absent',
        concept: sib.concept,
        missing,
        why: 'this rule names a table that does not exist, so it can no longer detect anything — fix the rule, do not delete it',
      });
    }
  }
  sanity = 'catalogue tables confirmed present';
}

console.log(JSON.stringify({
  checked_files: files.length,
  siblings: SIBLINGS.map((s) => s.tables),
  sanity,
  findings,
}, null, 2));

if (strict && findings.length) process.exit(6);
