#!/usr/bin/env node
// Fetch the DjVuTXT sidecar for want-list identifiers and write them to the
// vault as plain text, one file per book, with a manifest.
//
// This closes the gap the want-list left open. build-want-list.mjs produced 81
// identifiers on 2026-08-04 and there was NO script that fetched any of them —
// the contract said it "takes named identifiers" and nothing consumed them. A
// want-list nobody can act on is a list, not a pipeline.
//
// WHAT THIS DOES NOT DO. It does not touch books.sqlite. Writing into the
// Library's catalogue is a schema-bearing operation on a database six claims
// ground in, and it belongs behind a reviewed migration, not behind a fetch
// loop. This lands text on the vault and records exactly what arrived, so the
// ingest decision is made on evidence rather than on a promise.
//
// POLITENESS. archive.org is volunteer-run and serves this for free. One
// request at a time, a pause between items, a hard cap on how many run, and any
// HTTP error stops that item rather than retrying in a loop.
//
//   ia-ingest.mjs --limit 3            fetch 3 (default is a dry run)
//   ia-ingest.mjs --dry-run            show what would be fetched
//   ia-ingest.mjs --tier "English poetry" --limit 10
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, renameSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f, d) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] ? args[i + 1] : d; };

const WANT = 'sources/internet-archive/want-list-weak-subjects.json';
const VAULT = '/Volumes/SISO-STORAGE-VAULT/SISO-VAULT/librarian-vault/ia-ingest';
const limit = Number(val('--limit', '0'));
const tier = val('--tier', null);
// Default is a dry run. A script whose default behaviour hits a third party
// should have to be asked twice.
const dry = has('--dry-run') || limit === 0;

if (!existsSync(WANT)) { console.error(`want-list missing: ${WANT}`); process.exit(70); }
const want = JSON.parse(readFileSync(WANT, 'utf8'));

// Rights gate. 'not-a-designation' is excluded outright: measured 2026-08-04,
// that value is the literal string "Public Domain License", which is not a real
// designation and reads as free text an uploader typed.
const ELIGIBLE = new Set(['formal-designation', 'institutional-review', 'jurisdiction-scoped']);

let items = want.items.filter((i) => ELIGIBLE.has(i.rights_provenance));
if (tier) items = items.filter((i) => i.tier.endsWith(tier));

// Resume: never refetch something already on the vault. Makes repeated runs
// cheap for archive.org rather than repeatedly costly.
const already = new Set();
if (existsSync(VAULT)) {
  for (const i of items) {
    const p = join(VAULT, 'text', `${i.identifier}.txt`);
    if (existsSync(p) && statSync(p).size > 0) already.add(i.identifier);
  }
}
const todo = items.filter((i) => !already.has(i.identifier));

console.error(`eligible ${items.length} of ${want.items.length} by rights; ${already.size} already on vault; ${todo.length} to fetch`);
if (dry) {
  for (const i of todo.slice(0, 10)) console.error(`  would fetch ${i.identifier}  ${i.title.slice(0, 60)}`);
  console.error(todo.length > 10 ? `  ... and ${todo.length - 10} more` : '');
  console.error('\n(dry run — pass --limit N to fetch)');
  process.exit(0);
}

if (!existsSync(VAULT)) { console.error(`vault path missing (is the volume mounted?): ${VAULT}`); process.exit(70); }
mkdirSync(join(VAULT, 'text'), { recursive: true });

const results = [];
for (const item of todo.slice(0, limit)) {
  const rec = { identifier: item.identifier, title: item.title, tier: item.tier, rights_provenance: item.rights_provenance };
  try {
    const raw = execFileSync('curl', ['-sSL', '--max-time', '60', `https://archive.org/metadata/${item.identifier}`], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    const meta = JSON.parse(raw);
    // Prefer the real DjVuTXT sidecar. stub.txt and *_origin.txt appear beside
    // it at 0 bytes; picking the first .txt would silently "succeed" with an
    // empty file and count as an ingested book.
    const files = (meta.files || []).filter((f) => /_djvu\.txt$/.test(f.name || '') && Number(f.size || 0) > 1024);
    if (!files.length) { rec.status = 'NO_TEXT'; results.push(rec); console.error(`  ${item.identifier}: no djvu text`); continue; }
    const name = files[0].name;
    // Write to a file rather than capture stdout. Measured 2026-08-04: capturing
    // a redirected download as a utf8 string returned exactly 170 bytes for
    // three different items whose real sizes were 200-350 KB. Three identical
    // short reads is one systematic cause, not three missing books — and a
    // retry over the same URL returned the full 352,362 bytes. --retry rides
    // out the transient case; -o takes stdout buffering out of the path.
    const tmp = join(VAULT, 'text', `.${item.identifier}.part`);
    execFileSync('curl', ['-sSL', '--max-time', '300', '--retry', '3', '--retry-delay', '2',
      '-o', tmp, `https://archive.org/download/${item.identifier}/${encodeURIComponent(name)}`]);
    const text = readFileSync(tmp, 'utf8');
    // An HTTP error body is still a 200-shaped string to curl -sSL. A book that
    // is 300 bytes of HTML is a failure, not a short book.
    if (text.length < 2048 || /^\s*<(!doctype|html)/i.test(text)) { rmSync(tmp, { force: true }); rec.status = 'BAD_BODY'; rec.bytes = text.length; rec.declared_size = Number(files[0].size || 0); results.push(rec); console.error(`  ${item.identifier}: body too small or HTML (${text.length}B, declared ${files[0].size}B)`); continue; }
    renameSync(tmp, join(VAULT, 'text', `${item.identifier}.txt`));
    rec.status = 'OK'; rec.bytes = text.length; rec.source_file = name;
    rec.rights = String(meta.metadata?.rights || '').slice(0, 200);
    results.push(rec);
    console.error(`  ${item.identifier}: ${(text.length / 1024).toFixed(0)} KB  ${item.title.slice(0, 50)}`);
  } catch (e) {
    rec.status = 'ERROR'; rec.error = String(e.message || e).slice(0, 200);
    results.push(rec);
    console.error(`  ${item.identifier}: ERROR ${rec.error}`);
  }
  execFileSync('sleep', ['2']);   // volunteer-run archive; be patient
}

const ok = results.filter((r) => r.status === 'OK');
const manifest = {
  schema_version: 'ia-ingest-v1',
  fetched_at: new Date().toISOString(),
  source_want_list: WANT,
  rights_gate: [...ELIGIBLE],
  attempted: results.length,
  ok: ok.length,
  failed: results.length - ok.length,
  total_bytes: ok.reduce((s, r) => s + (r.bytes || 0), 0),
  note: 'Text only. Nothing was written to books.sqlite — catalogue ingest is a separate reviewed step.',
  results,
};
// Second-precision, and REFUSE to overwrite. Measured 2026-08-05: the previous
// slice(0,15) truncated to the MINUTE, so a fetch and its retry landed in the
// same minute and the retry silently overwrote the first manifest — destroying
// the record of 34 fetched books. The text files survived; their provenance did
// not, and the catalogue migration reads manifests, so those 34 became
// uncatalogued with no error anywhere.
//
// A losing write that reports success is the worst shape of defect here.
let mpath = join(VAULT, `manifest-${new Date().toISOString().replace(/[:.]/g, '').slice(0, 17)}Z.json`);
for (let i = 2; existsSync(mpath); i += 1) {
  mpath = join(VAULT, `manifest-${new Date().toISOString().replace(/[:.]/g, '').slice(0, 17)}Z-${i}.json`);
}
writeFileSync(mpath, JSON.stringify(manifest, null, 2) + '\n');
console.error(`\n${ok.length}/${results.length} fetched, ${(manifest.total_bytes / 1048576).toFixed(1)} MB`);
console.error(`manifest: ${mpath}`);
