#!/usr/bin/env node
// Re-runs the Internet Archive metadata probe against the same five identifiers.
//
// This is a REPRODUCER, not a derivation: it issues live network requests and
// can contradict the stored result. That distinction is enforced by the audit,
// which accepts `reproduced_by` only when the named script exists on disk.
//
// Why the numbers here are expected to move, and why that is not a defect:
// `numFound` on the public-domain search was 1,367,676 when first probed and
// changes as the archive grows, so an exact match would be surprising. What
// must hold is the CONTRACT — metadata reachable, rights signal present, a
// DjVuTXT sidecar listed — not the census.
//
// A HEAD failure is a routing-to-review condition, not a rejection: the
// original probe accepted 3 of 5 with 4 of 5 HEADs succeeding, and treating a
// transient 403 as "not public domain" would silently shrink the corpus for a
// reason that has nothing to do with rights.
//
//   node scripts/ia-probe-reproduce.mjs           print comparison
//   node scripts/ia-probe-reproduce.mjs --write   also write a metrics file
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const STORED = 'metrics/2026-08-03-ia-live-metadata-probe-combined.json';
const stored = JSON.parse(readFileSync(STORED, 'utf8'));
const ids = stored.probe_general_named.results.map((r) => r.id);

const curl = (url) => {
  try {
    return execFileSync('curl', ['-sS', '--max-time', '30', url], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  } catch { return ''; }
};

const results = [];
for (const id of ids) {
  const raw = curl(`https://archive.org/metadata/${encodeURIComponent(id)}`);
  let meta = null;
  try { meta = JSON.parse(raw); } catch { /* unreachable is reported, not dropped */ }
  const m = meta?.metadata || {};
  const files = meta?.files || [];
  const rights = String(m.rights || m.licenseurl || '').toLowerCase();
  const possible = String(m['possible-copyright-status'] || '').toLowerCase();
  results.push({
    id,
    metadata_ok: !!meta && Object.keys(m).length > 0,
    mediatype: m.mediatype || null,
    public_domain_signal: rights.includes('public domain') || possible.includes('no known copyright'),
    djvu_txt: files.some((f) => String(f.format || '').includes('DjVuTXT')),
  });
}

// The live census, for comparison against the stored figure.
const searchRaw = curl('https://archive.org/advancedsearch.php?q=' +
  encodeURIComponent('mediatype:texts AND rights:"public domain"') +
  '&rows=0&output=json');
let numFound = null;
try { numFound = JSON.parse(searchRaw)?.response?.numFound ?? null; } catch { /* reported as null */ }

const now = {
  identifiers_checked: results.length,
  metadata_ok: results.filter((r) => r.metadata_ok).length,
  public_domain_signal: results.filter((r) => r.public_domain_signal).length,
  djvu_txt_found: results.filter((r) => r.djvu_txt).length,
};
const then = stored.probe_general_named;

const contractHolds = now.metadata_ok === then.metadata_ok
  && now.public_domain_signal === then.public_domain_signal
  && now.djvu_txt_found === then.djvu_txt_found;

const out = {
  measured_at: new Date().toISOString(),
  question: 'GQ-009',
  reproduces: STORED,
  note: 'Fresh network observation. numFound is expected to drift; the contract shape is what must hold.',
  stored: {
    identifiers_checked: then.identifiers_checked,
    metadata_ok: then.metadata_ok,
    public_domain_signal: then.public_domain_signal,
    djvu_txt_found: then.djvu_txt_found,
    numFound: stored.search.numFound_live,
  },
  now: { ...now, numFound },
  contract_holds: contractHolds,
  numFound_delta: numFound === null ? null : numFound - stored.search.numFound_live,
  results,
};

console.log(JSON.stringify({ ...out, results: undefined }, null, 2));

if (process.argv.includes('--write')) {
  const stamp = new Date().toISOString().slice(0, 10);
  const path = `metrics/${stamp}-ia-probe-reproduction.json`;
  writeFileSync(path, JSON.stringify(out, null, 2) + '\n');
  console.log(`wrote ${path}`);
}

// Non-zero only when the contract itself fails, never on census drift.
if (!contractHolds) process.exit(6);
