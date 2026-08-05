#!/usr/bin/env node
// Can a reader actually GET to what this repo publishes?
//
// WHY. Five times in this session I built something and left it unreachable:
// outbox messages that nothing surfaced, corpus counts absent from the page
// that reports the corpus, search indexes nothing queried, a search CLI the page
// never mentioned, and a gate wired to nothing. Each was fixed by hand, one at a
// time, after noticing.
//
// The scripts are covered — audit-asserted-numbers reports `script-unreferenced`.
// The verify chain is covered — audit-verify-chain reports `gate-dropped-from-chain`.
// What nothing covered is the thing every one of those five failures actually
// was: a PAGE a person is expected to read, with no path to it.
//
// WHAT IT CHECKS
//   - every .html in public/ is reachable from the index (or is the index)
//   - every page links somewhere — a dead end is half a defect
//   - pages the index names actually exist
//
// Measured 2026-08-05: library.html was linked FROM the observatory and linked
// nowhere itself. A reader browsing to the corpus had to edit the URL by hand.
//
//   audit-reachability.mjs           report
//   audit-reachability.mjs --strict  exit non-zero on any finding
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pubDir = join(root, 'public');
const findings = [];

if (!existsSync(pubDir)) {
  console.log(JSON.stringify({ skipped: true, reason: 'no public/ directory', note: 'NOT a pass.' }, null, 2));
  process.exit(0);
}

const pages = readdirSync(pubDir).filter((f) => f.endsWith('.html'));
const INDEX = 'index.html';
const linksIn = new Map();
const linksOut = new Map();

for (const p of pages) {
  const html = readFileSync(join(pubDir, p), 'utf8');
  // Internal hrefs only. An external link does not make a page reachable and
  // does not stop it being a dead end.
  const hrefs = [...html.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1]);
  linksOut.set(p, hrefs);
  for (const h of hrefs) {
    const target = h === '/' ? INDEX : h.replace(/^\//, '');
    if (!linksIn.has(target)) linksIn.set(target, []);
    linksIn.get(target).push(p);
  }
}

for (const p of pages) {
  // Reachable: it is the index, or something links to it.
  if (p !== INDEX && !(linksIn.get(p) || []).length) {
    findings.push({
      kind: 'page-unreachable',
      page: `public/${p}`,
      why: 'no other page links to it — a reader can only arrive by typing the URL',
    });
  }
  // A dead end: no internal link out. The index is exempt; it is the root.
  if (p !== INDEX && !(linksOut.get(p) || []).length) {
    findings.push({
      kind: 'page-is-a-dead-end',
      page: `public/${p}`,
      why: 'links nowhere internal — a reader who arrives has no way back',
    });
  }
}

// A link to a page that is not there.
for (const [target, sources] of linksIn) {
  if (!pages.includes(target)) {
    findings.push({ kind: 'link-to-missing-page', target, linked_from: sources });
  }
}

// The rule must be able to fail. No pages at all means this checked nothing,
// which reads identical to a clean result.
if (!pages.length) {
  findings.push({ kind: 'no-pages-found', why: 'public/ has no .html — this check can detect nothing' });
}

console.log(JSON.stringify({
  pages: pages.length,
  page_names: pages,
  findings,
}, null, 2));

if (process.argv.includes('--strict') && findings.length) process.exit(6);
