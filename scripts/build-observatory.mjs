#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync } from 'node:fs';
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

// The registry is the canonical list of God Questions; this repo's portfolio is
// a working view over the subset the librarian has claims for. Showing only the
// portfolio hid five registered questions — the observatory is meant to show
// which God Question is being worked, so it must read the registry's list.
function registryQuestions() {
  const dir = join(registry, 'works');
  if (!existsSync(dir)) return { total: null, questions: [] };
  const files = sh('find', [dir, '-type', 'f', '-name', '*.json']).split('\n').filter(Boolean);
  const qs = [];
  for (const f of files) {
    try {
      const d = JSON.parse(readFileSync(f, 'utf8'));
      const m = /^(GQ-\d+)\s*·\s*(.+)$/.exec(String(d.name || ''));
      if (!m) continue;
      // GQ-009 success criterion 1: a cold reader must find each question's
      // state, decision target, evidence gaps, falsifiers, watch triggers and
      // answer line. Listing id+title alone fails that test, and the registry
      // already carries every field — it was simply never surfaced.
      const rc = d.research_contract || {};
      qs.push({
        id: m[1],
        title: m[2],
        lifecycle: d.lifecycle_status || null,
        updated_at: d.updated_at || null,
        state: rc.state || null,
        decision_to_change: rc.decision_to_change || null,
        success_criteria: (rc.success_criteria || []).length,
        falsifiers: (rc.falsifiers || []).length,
        watch_triggers: (rc.watch_triggers || []).length,
        evidence_gaps: (rc.evidence_gaps || []).length,
        answer_shape: rc.answer_shape ? String(rc.answer_shape).slice(0, 160) : null,
      });
    } catch { /* counted separately by missing/unreadable reporting */ }
  }
  qs.sort((a, b) => a.id.localeCompare(b.id));
  return { total: qs.length, questions: qs };
}
const registryGQ = registryQuestions();

// Releases point at works by work_id. An orphaned release — one referencing a
// work that does not exist — is a broken registry that every count would still
// report as healthy, because counting files never dereferences anything.
function releaseIntegrity() {
  const wdir = join(registry, 'works');
  const rdir = join(registry, 'releases');
  if (!existsSync(wdir) || !existsSync(rdir)) return null;
  const readAll = (dir) => sh('find', [dir, '-type', 'f', '-name', '*.json']).split('\n').filter(Boolean)
    .map((f) => { try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return null; } }).filter(Boolean);
  const workIds = new Set(readAll(wdir).map((d) => d.id));
  const rels = readAll(rdir);
  const referenced = new Set(rels.map((d) => d.work_id).filter(Boolean));
  const orphans = rels.filter((d) => d.work_id && !workIds.has(d.work_id)).length;
  return {
    releases: rels.length,
    works_referenced: referenced.size,
    works_total: workIds.size,
    works_without_releases: workIds.size - referenced.size,
    orphaned_releases: orphans,
  };
}
const releaseState = releaseIntegrity();

// Decisions the librarian has deliberately not made. The point of a standing
// agent is that it acts without asking — which makes the short list of things
// it genuinely cannot decide alone the most important thing on the page, not
// an afterthought buried in a proposal file.
function blockedDecisions() {
  const f = join(root, 'proposals/2026-08-04-decisions-awaiting-shaan.md');
  // 0 would read as 'nothing blocked' — the same false reassurance as a
  // missing directory counting as zero. Absence is not an empty queue.
  if (!existsSync(f)) return { count: null, items: [], error: 'decision file missing' };
  const text = readFileSync(f, 'utf8');
  const items = [...text.matchAll(/^## (\d+)\. (.+)$/gm)].map((m) => m[2].trim());
  return { count: items.length, items, source: 'proposals/2026-08-04-decisions-awaiting-shaan.md' };
}
// Disk headroom is a charter watch item and it moved 6Gi in one session.
// A number that only appears when someone thinks to run df is not a watch.
function diskHeadroom() {
  try {
    const out = sh('df', ['-h', '/']).split('\n')[1].split(/\s+/);
    return { available: out[3], capacity: out[4] };
  } catch { return { available: 'unknown', capacity: 'unknown' }; }
}
const disk = diskHeadroom();

const blocked = blockedDecisions();

// Independent review is the one thing this agent cannot do for itself
// (GQ-009 watch trigger 5). Surfacing the count keeps it from being quietly
// forgotten simply because the portfolio looks complete.
const reviewState = (() => {
  const f = join(root, 'REVIEW-PACKET.md');
  if (!existsSync(f)) return 'SOURCE MISSING';
  const n = (readFileSync(f, 'utf8').match(/^## GQ-/gm) || []).length;
  return `${n} unreviewed`;
})();
const portfolioIds = new Set(portfolio.questions.map(q => q.id));
const contractComplete = registryGQ.questions.filter(q =>
  q.success_criteria > 0 && q.falsifiers > 0 && q.watch_triggers > 0).length;
const gqCoverage = {
  registered: registryGQ.total,
  with_testable_contract: contractComplete,
  with_local_claims: registryGQ.questions.filter(q => portfolioIds.has(q.id)).length,
  unclaimed: registryGQ.questions.filter(q => !portfolioIds.has(q.id)).map(q => q.id),
};

// 'Production claims: 10' beside 'Claims awaiting review: 8' looks like a
// contradiction to anyone who has not read the code. It is not — 10 counts
// every claim file, 8 counts only live ones — so the cards now say which.
const claimStatuses = sh('find', [join(root, 'claims'), '-type', 'f', '-name', '*.json'])
  .split('\n').filter(Boolean)
  .map((f) => { try { return JSON.parse(readFileSync(f, 'utf8')).claim.status; } catch { return 'unreadable'; } });
const claimsLive = claimStatuses.filter((s) => s !== 'superseded' && s !== 'unreadable').length;
const claimsSuperseded = claimStatuses.filter((s) => s === 'superseded').length;
const claimsUnreadable = claimStatuses.filter((s) => s === 'unreadable').length;

const claimLayer = {
  production_claims: sh('find', [join(root, 'claims'), '-type', 'f', '-name', '*.json']).split('\n').filter(Boolean).length,
  portfolio_questions: portfolio.questions.length,
  refresh_entries: refresh.entries.length,
  claims_live: claimsLive,
  claims_superseded: claimsSuperseded,
  claims_unreadable: claimsUnreadable,
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
  'repo_health.npm_scripts': { source: join(root, 'package.json'), kind: 'json-scripts-count', query: 'scripts' },
  'repo_health.metrics_files': { source: join(root, 'metrics'), kind: 'file-count', query: '*.json' },
  'repo_health.worklogs': { source: join(root, 'worklog'), kind: 'file-count', query: '*.md' },
  'repo_health.proposals': { source: join(root, 'proposals'), kind: 'file-count', query: '*.md' },
  'routing.requests': { source: join(home, '.config/bifrost/logs.db'), kind: 'sqlite', query: "select count(*) from logs where provider='Minimax' and model='MiniMax-M3' and timestamp >= datetime('now','-24 hours');" },
};

// Facts about the repo itself. These kept appearing as hand-typed numbers in
// worklog tables — "npm scripts 8 -> 10" was wrong and unchecked for two loops
// — and prose is the one artifact no gate reads. Emitting them here puts them
// under the existing derivation audit instead of inventing a sixth gate.
const repoHealth = {
  npm_scripts: Object.keys(JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).scripts || {}).length,
  verify_steps: (JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).scripts.verify || '').split('&&').length,
  scripts_on_disk: sh('find', [join(root, 'scripts'), '-type', 'f']).split('\n').filter(Boolean).length,
  metrics_files: sh('find', [join(root, 'metrics'), '-type', 'f', '-name', '*.json']).split('\n').filter(Boolean).length,
  worklogs: sh('find', [join(root, 'worklog'), '-type', 'f', '-name', '*.md']).split('\n').filter(Boolean).length,
  proposals: sh('find', [join(root, 'proposals'), '-type', 'f', '-name', '*.md']).split('\n').filter(Boolean).length,
};

// Escalations I could not deliver. The mailbox is my only push channel to
// Shaan and it had a single point of failure nobody was watching: outbox/sent/
// was EMPTY on 2026-08-04 — not one message had ever been delivered — while I
// repeatedly reported items as "queued" as though queued meant sent. "link
// down" is an explanation, not an outcome, and reading it as one let two
// escalations sit undelivered for hours.
//
// Age is emitted, not just count, because a queue that is merely non-empty
// looks the same on day one as on day five. The repo is the channel that
// actually works, so the queue belongs where the repo is read.
const outboxDir = join(root, 'outbox');
const queuedMsgs = existsSync(outboxDir)
  ? readdirSync(outboxDir).filter((f) => f.endsWith('.md')).sort()
  : [];
const oldestQueuedISO = queuedMsgs.length
  ? sh('git', ['log', '--diff-filter=A', '--format=%aI', '-1', '--', `outbox/${queuedMsgs[0]}`]).trim()
  : '';
const escalations = {
  queued: queuedMsgs.length,
  delivered_ever: existsSync(join(outboxDir, 'sent'))
    ? readdirSync(join(outboxDir, 'sent')).filter((f) => f.endsWith('.md')).length
    : 0,
  oldest_queued_at: oldestQueuedISO || null,
  oldest_queued_age_hours: oldestQueuedISO
    ? Math.round((Date.now() - new Date(oldestQueuedISO)) / 36e5 * 10) / 10
    : null,
  files: queuedMsgs,
  note: 'Undelivered. The laptop peer is unreachable; these are readable in outbox/ regardless.',
};

const snapshot = {
  generated_at: new Date().toISOString(),
  bucket_counts: { registry: registryCounts, passages: passageCounts, people_graph: peopleCounts, claim_layer: claimLayer },
  repo_health: repoHealth,
  derivations,
  active_questions: portfolio.questions.map(q => ({ id: q.id, text: q.text, status: q.status, action_status: q.action_status, claim_packets: q.claim_packets })),
  routing: minimaxRouting,
  library_snapshot: snapshotState,
  god_questions: { ...registryGQ, coverage: gqCoverage },
  release_integrity: releaseState,
  disk: disk,
  awaiting_decision: { ...blocked, successor_handover: 'HANDOVER-NEXT.md', review_packet: 'REVIEW-PACKET.md' },
  escalations,
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
  ['Works', show(registryCounts.works)], ['Releases', show(registryCounts.releases)], ['Orphaned releases', releaseState ? releaseState.orphaned_releases : 'unknown'], ['Source inventories', show(registryCounts.source_inventories)], ['Library snapshot', snapshotState ? `v${snapshotState.n} · ${snapshotState.releases} rel${snapshotState.unreadable_files?.length ? ` · ${snapshotState.unreadable_files.length} UNREADABLE` : ''}` : 'none'], ['Passages', passageCounts.passages.toLocaleString()], ['Books with passages', passageCounts.books.toLocaleString()],
  ['People', peopleCounts.people.toLocaleString()], ['Content edges', peopleCounts.content_edges.toLocaleString()], ['Topic edges', peopleCounts.topic_edges.toLocaleString()], ['External IDs', peopleCounts.external_ids.toLocaleString()], ['Cross-domain people', peopleCounts.cross_domain_people], ['Identity claims', peopleCounts.identity_claims],
  ['God Questions (registry)', registryGQ.total ?? 'SOURCE MISSING'], ['With local claims', `${gqCoverage.with_local_claims} of ${registryGQ.total}`], ['Testable contracts', `${contractComplete} of ${registryGQ.total}`], ['Awaiting your decision', blocked.count === null ? 'SOURCE MISSING' : blocked.count], ['Claims awaiting review', reviewState], ['Escalations undelivered', escalations.queued === 0 ? '0' : `${escalations.queued}${escalations.oldest_queued_age_hours != null ? ` · oldest ${escalations.oldest_queued_age_hours}h` : ''}`], ['Root disk free', disk.available], ['Claims (live)', claimsLive], ['Claims (superseded)', claimsSuperseded], ['Refresh entries', claimLayer.refresh_entries], ['MiniMax route (24h)', minimaxRouting.measured ? `${minimaxRouting.minimax_8081} · ${minimaxRouting.requests} req` : 'unknown']
];
const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SISO Great Library Observatory</title><style>
body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;margin:0;background:#0b1020;color:#eef2ff;-webkit-text-size-adjust:100%}main{max-width:1100px;margin:0 auto;padding:24px 16px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(180px,100%),1fr));gap:12px}@media(max-width:520px){.grid{grid-template-columns:1fr}.n{font-size:24px}main{padding:20px 14px}}html,body{overflow-x:hidden}.card{background:#151b31;border:1px solid #29324f;border-radius:14px;padding:16px;min-width:0}.n{font-size:26px;font-weight:800;overflow-wrap:anywhere;line-height:1.15}.k{color:#aab4d4;font-size:13px;text-transform:uppercase;letter-spacing:.06em}section{margin-top:34px}pre{white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;background:#11172a;padding:16px;border-radius:12px;border:1px solid #29324f;max-width:100%;font-size:12px}h1{overflow-wrap:anywhere;font-size:clamp(22px,6vw,34px)}.q{background:#10182f;border-left:4px solid #7dd3fc;padding:16px;border-radius:10px;overflow-wrap:anywhere}a{color:#7dd3fc}</style></head><body><main>
<h1>SISO Great Library Observatory</h1><p>Generated ${snapshot.generated_at}. The index is the asset; the corpus is a cache. Questions before corpora.</p>
<div class="grid">${cards.map(([k,v])=>`<div class="card"><div class="k">${k}</div><div class="n">${v}</div></div>`).join('')}</div>
<section><h2>Active God Questions</h2>${snapshot.active_questions.map(q=>`<div class="q"><h3>${q.id}: ${q.status}</h3><p>${q.text}</p><p>Action: <b>${q.action_status}</b> · Claims: ${q.claim_packets.join(', ')}</p></div>`).join('')}</section>
<section><h2>Caveats</h2><ul>${snapshot.caveats.map(c=>`<li>${c}</li>`).join('')}</ul></section>
<section><h2>Raw snapshot</h2><pre>${JSON.stringify(snapshot,null,2).replace(/[&<>]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]))}</pre></section>
</main></body></html>`;
writeFileSync(join(root, 'public/index.html'), html);
console.log(JSON.stringify({ wrote: ['observatory/snapshot.json', 'public/index.html'], counts: snapshot.bucket_counts }, null, 2));
