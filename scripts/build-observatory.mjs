#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const home = process.env.HOME;
function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts }).trim();
}
// A missing directory and an empty one both used to return 0, which is how a
// hyphen/underscore typo hid six source inventories: the count was structurally
// valid and semantically a lie. Missing paths are recorded so the page can say
// so rather than render a confident zero.
const missingSources = [];
function countFiles(dir) {
  if (!existsSync(dir)) {
    missingSources.push(dir.replace(home, '~'));
    return null;
  }
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
const peopleCounts = rowsToObject(sqlite(peopleDb, "select 'people',count(*) from person union all select 'content_edges',count(*) from person_content union all select 'topic_edges',count(*) from person_topic union all select 'external_ids',count(*) from external_ids union all select 'identity_claims',count(*) from identity_claim union all select 'cross_domain_people',count(*) from v_person_layers where domain_count>1;"));
const registryCounts = {
  works: countFiles(join(registry, 'works')),
  releases: countFiles(join(registry, 'releases')),
  source_inventories: countFiles(join(registry, 'source-inventories')),
  assembly_versions: countFiles(join(registry, 'assemblies')),
  snapshot_versions: countFiles(join(registry, 'snapshots')),
  events: countFiles(join(registry, 'events')),
  decisions: countFiles(join(registry, 'decisions')),
};
// The snapshots directory holds sequential versions of ONE whole-library
// snapshot (v1..vN), each superseding the last — not N distinct records.
// Counting the files as a bucket alongside Works overstates what the registry
// holds, so the page shows the CURRENT version and treats the file count as
// history depth.
function currentSnapshot() {
  const dir = join(registry, 'snapshots');
  if (!existsSync(dir)) return null;
  const files = sh('find', [dir, '-type', 'f', '-name', '*.json']).split('\n').filter(Boolean);
  const unreadable = [];
  let best = null;
  for (const f of files) {
    try {
      const d = JSON.parse(readFileSync(f, 'utf8'));
      const n = parseInt(String(d.version || '0'), 10) || 0;
      if (!best || n > best.n) best = { n, version: d.version, name: d.name, releases: (d.releases || []).length, created_at: d.created_at, immutable: d.immutable === true };
    } catch {
      // Never swallow this. A corrupt highest-version file would otherwise make
      // the page quietly display the previous version as if it were current —
      // verified: corrupting v36 silently rendered v35 with no warning.
      unreadable.push(f.split('/').pop());
    }
  }
  if (best) best.unreadable_files = unreadable;
  return best;
}
const snapshotState = currentSnapshot();

const claimLayer = {
  production_claims: sh('find', [join(root, 'claims'), '-type', 'f', '-name', '*.json']).split('\n').filter(Boolean).length,
  portfolio_questions: portfolio.questions.length,
  refresh_entries: refresh.entries.length,
};

// Every count records the exact command that produced it, so an auditor can
// re-derive it without knowing anything about this script. Written after an
// audit found fabricated values elsewhere in the repo: a number with no stated
// derivation is indistinguishable from one that was typed.
// Routing state is measured from Bifrost's own request log, never asserted.
// This card previously read a hardcoded "verified" citing a worklog — a banner
// claiming a present-tense fact from a past observation, which is precisely the
// failure the prove-model-routing skill exists to prevent. If the log has no
// recent MiniMax rows, the page must say so rather than reassure.
function measureRouting() {
  const logs = join(home, '.config/bifrost/logs.db');
  if (!existsSync(logs)) return { minimax_8081: 'unknown', reason: 'bifrost log not present', measured: false };
  try {
    const q = "select count(*), coalesce(sum(prompt_tokens),0), coalesce(sum(completion_tokens),0) "
      + "from logs where provider='Minimax' and model='MiniMax-M3' and timestamp >= datetime('now','-24 hours');";
    const [n, tin, tout] = sh('sqlite3', [`file:${logs}?mode=ro`, q]).split('|').map(Number);
    return {
      minimax_8081: n > 0 ? 'observed' : 'no recent traffic',
      measured: true,
      window: 'last 24h',
      requests: n,
      prompt_tokens: tin,
      completion_tokens: tout,
      source: '~/.config/bifrost/logs.db',
      note: n > 0
        ? 'Provider and model read from the gateway request log, not from a banner or a config label.'
        : 'No MiniMax-M3 rows in the window. Routing may still be configured; it is simply unproven right now.',
    };
  } catch (error) {
    // Distinguish failure modes. "unknown" that means the log is missing and
    // "unknown" that means the query is malformed need different responses, and
    // collapsing them hides a broken query behind a plausible-looking absence.
    const msg = String(error.message || '');
    const kind = /no such table|no such column|syntax error/i.test(msg) ? 'query_invalid'
      : /unable to open|not a database|disk I\/O/i.test(msg) ? 'log_unreadable'
      : 'query_failed';
    return { minimax_8081: 'unknown', failure: kind, reason: msg.slice(0, 200), measured: false };
  }
}
const minimaxRouting = measureRouting();

const derivations = {
  'passages.passages': { source: passagesDb, kind: 'sqlite', query: "select count(*) from passage;" },
  'passages.books': { source: passagesDb, kind: 'sqlite', query: "select count(*) from book_body;" },
  'people_graph.people': { source: peopleDb, kind: 'sqlite', query: "select count(*) from person;" },
  'people_graph.content_edges': { source: peopleDb, kind: 'sqlite', query: "select count(*) from person_content;" },
  'people_graph.topic_edges': { source: peopleDb, kind: 'sqlite', query: "select count(*) from person_topic;" },
  'people_graph.external_ids': { source: peopleDb, kind: 'sqlite', query: "select count(*) from external_ids;" },
  'people_graph.identity_claims': { source: peopleDb, kind: 'sqlite', query: "select count(*) from identity_claim;" },
  'people_graph.cross_domain_people': { source: peopleDb, kind: 'sqlite', query: "select count(*) from v_person_layers where domain_count>1;" },
  'registry.works': { source: join(registry, 'works'), kind: 'file-count', query: "*.json" },
  'registry.releases': { source: join(registry, 'releases'), kind: 'file-count', query: "*.json" },
  'registry.source_inventories': { source: join(registry, 'source-inventories'), kind: 'file-count', query: "*.json" },
  'registry.assembly_versions': { source: join(registry, 'assemblies'), kind: 'file-count', query: "*.json" },
  'registry.snapshot_versions': { source: join(registry, 'snapshots'), kind: 'file-count', query: "*.json" },
  'registry.events': { source: join(registry, 'events'), kind: 'file-count', query: "*.json" },
  'registry.decisions': { source: join(registry, 'decisions'), kind: 'file-count', query: "*.json" },
  'claim_layer.production_claims': { source: join(root, 'claims'), kind: 'file-count', query: "*.json" },
  'claim_layer.portfolio_questions': { source: join(root, 'questions/portfolio.json'), kind: 'json-length', query: "questions[]" },
  'claim_layer.refresh_entries': { source: join(root, 'refresh/ledger.json'), kind: 'json-length', query: "entries[]" },
  'routing.requests': { source: join(home, '.config/bifrost/logs.db'), kind: 'sqlite', query: "select count(*) from logs where provider='Minimax' and model='MiniMax-M3' and timestamp >= datetime('now','-24 hours');" },
};

const snapshot = {
  generated_at: new Date().toISOString(),
  bucket_counts: { registry: registryCounts, passages: passageCounts, people_graph: peopleCounts, claim_layer: claimLayer },
  derivations,
  active_questions: portfolio.questions.map(q => ({ id: q.id, text: q.text, status: q.status, action_status: q.action_status, claim_packets: q.claim_packets })),
  routing: minimaxRouting,
  library_snapshot: snapshotState,
  missing_sources: missingSources,
  caveats: [
    '/tmp/people_v2_gh.sqlite is a zero-byte stub; observatory uses ~/foundry-data/domains/people/people_v2.sqlite read-only.',
    'Registry directory names are hyphenated (source-inventories); an underscore path silently counted 0 until 2026-08-04.'
  ]
};
mkdirSync(join(root, 'observatory'), { recursive: true });
mkdirSync(join(root, 'public'), { recursive: true });
writeFileSync(join(root, 'observatory/snapshot.json'), JSON.stringify(snapshot, null, 2) + '\n');

// A null count means the source directory is absent — say so on the card
// instead of rendering the string "null", which reads like a bug rather than
// the honest signal it is.
const show = (v) => (v === null || v === undefined ? 'SOURCE MISSING' : v.toLocaleString());
const cards = [
  ['Works', show(registryCounts.works)], ['Releases', show(registryCounts.releases)], ['Source inventories', show(registryCounts.source_inventories)], ['Library snapshot', snapshotState ? `v${snapshotState.n} · ${snapshotState.releases} rel${snapshotState.unreadable_files?.length ? ` · ${snapshotState.unreadable_files.length} UNREADABLE` : ''}` : 'none'], ['Passages', passageCounts.passages.toLocaleString()], ['Books with passages', passageCounts.books.toLocaleString()],
  ['People', peopleCounts.people.toLocaleString()], ['Content edges', peopleCounts.content_edges.toLocaleString()], ['Topic edges', peopleCounts.topic_edges.toLocaleString()], ['External IDs', peopleCounts.external_ids.toLocaleString()], ['Cross-domain people', peopleCounts.cross_domain_people], ['Identity claims', peopleCounts.identity_claims],
  ['Active questions', claimLayer.portfolio_questions], ['Production claims', claimLayer.production_claims], ['Refresh entries', claimLayer.refresh_entries], ['MiniMax route (24h)', minimaxRouting.measured ? `${minimaxRouting.minimax_8081} · ${minimaxRouting.requests} req` : 'unknown']
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
