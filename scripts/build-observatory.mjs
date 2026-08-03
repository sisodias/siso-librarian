#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const home = process.env.HOME;
function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts }).trim();
}
function countFiles(dir) {
  if (!existsSync(dir)) return 0;
  return Number(sh('find', [dir, '-type', 'f', '-name', '*.json']).split('\n').filter(Boolean).length);
}
function sqlite(db, sql) {
  return sh('sqlite3', [db, sql]);
}
function rowsToObject(text) {
  const out = {};
  for (const line of text.split('\n').filter(Boolean)) {
    const [k, v] = line.split('|');
    out[k] = Number(v);
  }
  return out;
}

const registry = join(home, 'SISO_Workspace/great-library-of-siso/registry');
const passagesDb = join(home, 'passages.sqlite');
const peopleDb = join(home, 'foundry-data/domains/people/people_v2.sqlite');
const portfolio = JSON.parse(readFileSync(join(root, 'questions/portfolio.json'), 'utf8'));
const refresh = JSON.parse(readFileSync(join(root, 'refresh/ledger.json'), 'utf8'));

const passageCounts = rowsToObject(sqlite(passagesDb, "select 'passages',count(*) from passage union all select 'books',count(*) from book_body;"));
const peopleCounts = rowsToObject(sqlite(peopleDb, "select 'people',count(*) from person union all select 'content_edges',count(*) from person_content union all select 'topic_edges',count(*) from person_topic union all select 'external_ids',count(*) from external_ids;"));
const registryCounts = {
  works: countFiles(join(registry, 'works')),
  releases: countFiles(join(registry, 'releases')),
  source_inventories: countFiles(join(registry, 'source_inventories')),
  events: countFiles(join(registry, 'events')),
  decisions: countFiles(join(registry, 'decisions')),
};
const claimLayer = {
  production_claims: sh('find', [join(root, 'claims'), '-type', 'f', '-name', '*.json']).split('\n').filter(Boolean).length,
  portfolio_questions: portfolio.questions.length,
  refresh_entries: refresh.entries.length,
};

const snapshot = {
  generated_at: new Date().toISOString(),
  bucket_counts: { registry: registryCounts, passages: passageCounts, people_graph: peopleCounts, claim_layer: claimLayer },
  active_questions: portfolio.questions.map(q => ({ id: q.id, text: q.text, status: q.status, action_status: q.action_status, claim_packets: q.claim_packets })),
  routing: { minimax_8081: 'verified: model MiniMax-M3 via worklog/2026-08-03-2145-minimax-routing-repair.md' },
  caveats: [
    '/tmp/people_v2_gh.sqlite is a zero-byte stub; observatory uses ~/foundry-data/domains/people/people_v2.sqlite read-only.',
    'Registry source inventory count uses registry/source_inventories path; if schema path changes, update builder.'
  ]
};
mkdirSync(join(root, 'observatory'), { recursive: true });
mkdirSync(join(root, 'public'), { recursive: true });
writeFileSync(join(root, 'observatory/snapshot.json'), JSON.stringify(snapshot, null, 2) + '\n');

const cards = [
  ['Works', registryCounts.works], ['Releases', registryCounts.releases], ['Passages', passageCounts.passages.toLocaleString()], ['Books with passages', passageCounts.books.toLocaleString()],
  ['People', peopleCounts.people.toLocaleString()], ['Content edges', peopleCounts.content_edges.toLocaleString()], ['Topic edges', peopleCounts.topic_edges.toLocaleString()], ['External IDs', peopleCounts.external_ids.toLocaleString()],
  ['Active questions', claimLayer.portfolio_questions], ['Production claims', claimLayer.production_claims], ['Refresh entries', claimLayer.refresh_entries], ['MiniMax route', 'verified']
];
const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SISO Great Library Observatory</title><style>
body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;margin:0;background:#0b1020;color:#eef2ff}main{max-width:1100px;margin:0 auto;padding:40px 24px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px}.card{background:#151b31;border:1px solid #29324f;border-radius:14px;padding:18px}.n{font-size:28px;font-weight:800}.k{color:#aab4d4;font-size:13px;text-transform:uppercase;letter-spacing:.06em}section{margin-top:34px}pre{white-space:pre-wrap;background:#11172a;padding:16px;border-radius:12px;border:1px solid #29324f}.q{background:#10182f;border-left:4px solid #7dd3fc;padding:16px;border-radius:10px}a{color:#7dd3fc}</style></head><body><main>
<h1>SISO Great Library Observatory</h1><p>Generated ${snapshot.generated_at}. The index is the asset; the corpus is a cache. Questions before corpora.</p>
<div class="grid">${cards.map(([k,v])=>`<div class="card"><div class="k">${k}</div><div class="n">${v}</div></div>`).join('')}</div>
<section><h2>Active God Questions</h2>${snapshot.active_questions.map(q=>`<div class="q"><h3>${q.id}: ${q.status}</h3><p>${q.text}</p><p>Action: <b>${q.action_status}</b> · Claims: ${q.claim_packets.join(', ')}</p></div>`).join('')}</section>
<section><h2>Caveats</h2><ul>${snapshot.caveats.map(c=>`<li>${c}</li>`).join('')}</ul></section>
<section><h2>Raw snapshot</h2><pre>${JSON.stringify(snapshot,null,2).replace(/[&<>]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]))}</pre></section>
</main></body></html>`;
writeFileSync(join(root, 'public/index.html'), html);
console.log(JSON.stringify({ wrote: ['observatory/snapshot.json', 'public/index.html'], counts: snapshot.bucket_counts }, null, 2));
