#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'node:fs';

const ids = (process.argv.slice(2).length ? process.argv.slice(2) : [
  'adventuresofsherl00doyl',
  'prideprejudice00aust_1',
  'federalistpapers00hami'
]);

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
}

function hasPublicDomain(metadata) {
  const haystack = [
    ...asArray(metadata.rights),
    ...asArray(metadata.licenseurl),
    ...asArray(metadata.possibleCopyrightStatus),
    ...asArray(metadata.access_restricted)
  ].join(' ').toLowerCase();
  return haystack.includes('public domain') || haystack.includes('creativecommons.org/publicdomain') || haystack.includes('pd-old') || haystack.includes('not in copyright');
}

async function probe(id) {
  const metadataUrl = `https://archive.org/metadata/${encodeURIComponent(id)}`;
  const started = Date.now();
  const metaRes = await fetch(metadataUrl, { headers: { accept: 'application/json', 'user-agent': 'siso-librarian-ia-probe/1.0' } });
  const result = { id, metadata_url: metadataUrl, metadata_status: metaRes.status, elapsed_ms: null, mediatype: null, public_domain_signal: false, djvu_txt: null, head: null, decision: 'reject' };
  if (!metaRes.ok) {
    result.elapsed_ms = Date.now() - started;
    return result;
  }
  const doc = await metaRes.json();
  const metadata = doc.metadata || {};
  result.mediatype = metadata.mediatype || doc.item?.mediatype || null;
  result.public_domain_signal = hasPublicDomain(metadata);
  const sidecar = (doc.files || []).find((file) => file.format === 'DjVuTXT' || /_djvu\.txt(?:\.gz)?$/i.test(file.name || ''));
  if (sidecar) {
    const name = sidecar.name;
    const url = `https://archive.org/download/${encodeURIComponent(id)}/${name.split('/').map(encodeURIComponent).join('/')}`;
    result.djvu_txt = { name, format: sidecar.format || null, size: Number(sidecar.size || 0), md5: sidecar.md5 || null, url };
    const headRes = await fetch(url, { method: 'HEAD', headers: { 'user-agent': 'siso-librarian-ia-probe/1.0' } });
    result.head = { status: headRes.status, content_length: Number(headRes.headers.get('content-length') || 0), content_type: headRes.headers.get('content-type') || null };
  }
  const hasSidecar = Boolean(result.djvu_txt);
  const headOk = result.head && result.head.status >= 200 && result.head.status < 400 && result.head.content_length > 1024;
  result.decision = result.mediatype === 'texts' && result.public_domain_signal && hasSidecar && headOk ? 'accept' : 'review';
  result.elapsed_ms = Date.now() - started;
  return result;
}

const results = [];
for (const id of ids) results.push(await probe(id));
const summary = {
  generated_at: new Date().toISOString(),
  identifiers_checked: results.length,
  metadata_ok: results.filter((r) => r.metadata_status === 200).length,
  public_domain_signal: results.filter((r) => r.public_domain_signal).length,
  djvu_txt_found: results.filter((r) => r.djvu_txt).length,
  head_ok: results.filter((r) => r.head && r.head.status >= 200 && r.head.status < 400).length,
  accepted: results.filter((r) => r.decision === 'accept').length,
  results
};
mkdirSync('metrics', { recursive: true });
writeFileSync('metrics/2026-08-03-ia-live-metadata-probe.json', JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
