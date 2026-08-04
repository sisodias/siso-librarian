#!/usr/bin/env node
// Audits numbers this agent asserted in prose against sources that can be
// re-derived mechanically.
//
// Written after discovering that every worklog timestamp on 2026-08-04 was
// fabricated: plausible-looking times typed instead of read from the clock,
// wrong by up to three hours, and invisible until git metadata disagreed.
// Prose is where unchecked claims accumulate, because nothing validates it.
//
// Read-only. Reports; never rewrites.
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, relative } from 'node:path';

const root = process.cwd();

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const findings = [];

function git(args) {
  try { return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim(); }
  catch { return ''; }
}

// --- Check 1: worklog filename timestamps against real commit times ---------
// A worklog named ...-0010-... asserts it was written at 00:10 UTC. The commit
// that added it is the only independent record of when that actually was.
const TOLERANCE_MIN = 90;
const worklogs = git(['ls-files', 'worklog/']).split('\n').filter(Boolean);

for (const path of worklogs) {
  const m = path.match(/(\d{4}-\d{2}-\d{2})-(\d{2})(\d{2})-/);
  if (!m) continue; // older worklogs carry no time component
  const [, date, hh, mm] = m;
  const claimed = new Date(`${date}T${hh}:${mm}:00Z`);
  const added = git(['log', '--diff-filter=A', '--format=%aI', '-1', '--', path]);
  if (!added) continue;
  const actual = new Date(added);
  const driftMin = Math.round((actual - claimed) / 60000);
  if (Math.abs(driftMin) > TOLERANCE_MIN) {
    findings.push({
      check: 'worklog-timestamp',
      path,
      claimed: claimed.toISOString(),
      actual_commit_time: actual.toISOString(),
      drift_minutes: driftMin,
    });
  }
}

// --- Check 2: metrics files claiming counts that name a live source ---------
// A metrics file asserting "passages: 41501325" is only trustworthy if the
// artifact it names still reports that. Only checks sources cheap to re-derive.
// The snapshot declares how each count was derived, so this re-runs those
// declarations rather than hardcoding checks here. Anything the builder can
// measure, the auditor can independently re-measure — the number in the file
// and the number in the source cannot silently diverge.
let countsChecked = 0;
const SNAPSHOT = 'observatory/snapshot.json';

// One resolver for every caller. There were two — deriveCount for the snapshot
// loop and deriveValue for declared metrics — and they drifted: json-scripts-count
// lived in one, file-bytes and the jsonl kinds in the other. A label declared
// against the wrong caller resolved to "unavailable" while the gate reported
// success. Adding a kind here now reaches every path by construction.
function derive(d) {
  const src = String(d.source || '').replace(/^~/, process.env.HOME);
  if (!src) return null;
  if (!existsSync(src)) return d.kind === 'file-count' ? 0 : null;
  switch (d.kind) {
    case 'sqlite':
      return Number(execFileSync('sqlite3', [`file:${src}?mode=ro`, d.query], { encoding: 'utf8' }).trim());
    case 'file-count': {
      const out = execFileSync('find', [src, '-type', 'f', '-name', d.query], { encoding: 'utf8' }).trim();
      return out ? out.split('\n').length : 0;
    }
    case 'file-bytes':
      return statSync(src).size;
    case 'json-length': {
      const doc = JSON.parse(readFileSync(src, 'utf8'));
      const key = String(d.query).replace('[]', '');
      return Array.isArray(doc?.[key]) ? doc[key].length : null;
    }
    case 'json-scripts-count':
      return Object.keys(JSON.parse(readFileSync(src, 'utf8'))[d.query] || {}).length;
    case 'jsonl-sum': {
      const rows = readFileSync(src, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
      return rows.reduce((a, r) => a + (r[d.query] || 0), 0);
    }
    case 'jsonl-count':
      return readFileSync(src, 'utf8').split('\n').filter(Boolean).length;
    default:
      return null;
  }
}

// A derivation whose source does not exist is the dangerous case, because
// file-count returns 0 for a missing directory and 0 looks like a real answer.
// That is exactly how a hyphen/underscore typo hid six source inventories: the
// builder and the declaration shared the wrong path, so re-derivation agreed
// with itself. Existence is checked separately from value.
let sourcesChecked = 0;
function checkSourceExists(label, d, file) {
  const src = String(d.source || '').replace(/^~/, process.env.HOME);
  if (!src) return;
  sourcesChecked += 1;
  if (!existsSync(src)) {
    findings.push({ check: 'derivation-source-missing', file, label, source: d.source, kind: d.kind,
      note: 'Source path does not exist. A file-count over a missing directory silently yields 0.' });
  }
}

if (existsSync(SNAPSHOT)) {
  const snap = JSON.parse(readFileSync(SNAPSHOT, 'utf8'));
  for (const [label, d] of Object.entries(snap.derivations || {})) {
    checkSourceExists(label, d, SNAPSHOT);
    const [group, key] = label.split('.');
    // Resolve the label against bucket_counts first (where most live), then
    // against the snapshot root. Hardcoding bucket_counts meant a declared
    // derivation outside it resolved to undefined and was SKIPPED SILENTLY —
    // repo_health.* was declared, audited nothing, and reported success.
    const asserted = snap?.bucket_counts?.[group]?.[key] ?? snap?.[group]?.[key];
    if (typeof asserted !== 'number') continue;
    let derived = null;
    try { derived = derive(d); } catch { derived = null; }
    if (derived === null) {
      findings.push({ check: 'metric-count', file: SNAPSHOT, label, asserted, derived: 'unavailable', status: 'unverifiable' });
      continue;
    }
    countsChecked += 1;
    if (derived !== asserted) {
      findings.push({ check: 'metric-count', file: SNAPSHOT, label, asserted, derived, delta: derived - asserted });
    }
  }
}

// --- Check 3: any metrics file that declares its own derivations ------------
// Nothing is hardcoded here. A metrics file states how each number it asserts
// can be re-derived, and this re-runs those declarations. The previous version
// listed specific totals in this script, which meant every new artifact needed
// a hand-edit here to be covered — the manual step that rots, and the reason
// most of the repo's numbers went unchecked in the first place.
//
// Shape, in any metrics/*.json:
//   "derivations": {
//     "some.dotted.path": { "kind": "...", "source": "...", "query": "..." }
//   }
// The dotted path is resolved against the file's own contents.
function resolvePath(doc, dotted) {
  return dotted.split('.').reduce((o, k) => (o == null ? undefined : o[k]), doc);
}

let declaredChecked = 0;
let declaredUnavailable = 0;
// Enumerate from disk, not from git. Using `git ls-files` made untracked
// metrics files invisible to this audit — a brand-new file's numbers went
// unchecked until someone committed it, and "the audit passed" quietly meant
// less than it appeared. Untracked files are now audited AND reported, so the
// gap is visible instead of silent.
const trackedMetrics = new Set(git(['ls-files', 'metrics/']).split('\n').filter(Boolean));
const metricsFiles = walk(join(root, 'metrics'))
  .map((f) => relative(root, f))
  .filter((p) => p.endsWith('.json'))
  .sort();
const untrackedMetrics = metricsFiles.filter((p) => !trackedMetrics.has(p));
for (const p of untrackedMetrics) {
  findings.push({ check: 'metrics-untracked', file: p,
    note: 'Present on disk but not tracked by git. Audited here, but it would vanish from a fresh clone.' });
}

// Which metrics files carry evidentiary weight — i.e. a live claim grounds in
// them. Superseded and disputed claims are excluded: a disputed claim's
// evidence is already flagged by the dispute itself, and re-reporting it here
// would double-count a known problem.
const groundedMetrics = new Set();
for (const cf of walk(join(root, 'claims'))) {
  if (!cf.endsWith('.json')) continue;
  let cd;
  try { cd = JSON.parse(readFileSync(cf, 'utf8')); } catch { continue; }
  const status = cd?.claim?.status;
  if (status === 'superseded' || status === 'disputed') continue;
  for (const g of cd?.grounding || []) {
    const id = g?.source?.id;
    if (typeof id === 'string' && id.startsWith('metrics/')) groundedMetrics.add(id);
  }
}

for (const file of metricsFiles) {
  if (!existsSync(file)) continue;
  let doc;
  try { doc = JSON.parse(readFileSync(file, 'utf8')); } catch { continue; }
  if (!doc || typeof doc !== 'object') continue;
  // A metrics file with no derivations was SKIPPED SILENTLY, which meant
  // omitting the block bought exemption from this audit. On 2026-08-04 every
  // one of the seven live claims rested on a metrics file in exactly that
  // state, and one of them (GQ-005 category momentum) turned out to assert
  // per-category counts matching no database on this machine. The gate was
  // structurally unable to notice, because unchecked files reported nothing
  // rather than reporting that they were unchecked.
  //
  // Only files a claim actually grounds in are reported: an intermediate or
  // exploratory metrics file carries no weight until something cites it, and
  // flagging those would train me to ignore this finding.
  if (!doc.derivations) {
    if (groundedMetrics.has(file)) {
      findings.push({ check: 'metrics-underived', file,
        note: 'A live claim grounds in this file, but it declares no derivations, so none of its numbers are re-derivable. Add a derivations block naming the source and query.' });
    }
    continue;
  }
  for (const [dotted, d] of Object.entries(doc.derivations)) {
    checkSourceExists(dotted, d, file);
    const asserted = resolvePath(doc, dotted);
    if (typeof asserted !== 'number') continue;
    let derived = null;
    try { derived = derive(d); } catch { derived = null; }
    if (derived === null) {
      declaredUnavailable += 1;
      findings.push({ check: 'declared-derivation', file, path: dotted, asserted, derived: 'unavailable', status: 'source_missing' });
      continue;
    }
    declaredChecked += 1;
    if (derived !== asserted) {
      findings.push({ check: 'declared-derivation', file, path: dotted, asserted, derived, delta: derived - asserted });
    }
  }
}
const jsonlSumsChecked = declaredChecked;

// --- Check 5: documented commands must exist -------------------------------
// On 2026-08-04 a package.json rewrite silently dropped two npm scripts that a
// worklog claimed to have added and the README documented. Nothing noticed
// until the command was run a loop later. Prose that names a command is a
// claim, and this checks it the same way byte ranges are checked.
let documentedCommands = 0;
if (existsSync('README.md') && existsSync('package.json')) {
  const readme = readFileSync('README.md', 'utf8');
  const scripts = new Set(Object.keys(JSON.parse(readFileSync('package.json', 'utf8')).scripts || {}));
  const named = new Set([...readme.matchAll(/npm run ([a-z][\w:-]*)/g)].map((m) => m[1]));
  for (const name of named) {
    documentedCommands += 1;
    if (!scripts.has(name)) {
      findings.push({ check: 'documented-command-missing', command: `npm run ${name}`,
        note: 'README documents this command but package.json has no such script.' });
    }
  }
  for (const f of walk(join(root, 'scripts'))) {
    const rel = relative(root, f);
    if (!/\.(mjs|sh)$/.test(rel)) continue;
    const referenced = readme.includes(rel) || [...scripts].some((k) =>
      JSON.parse(readFileSync('package.json', 'utf8')).scripts[k].includes(relative(root, f)));
    if (!referenced) {
      findings.push({ check: 'script-unreferenced', file: rel,
        note: 'Present in scripts/ but reachable from neither package.json nor the README.' });
    }
  }
}

const drift = findings.filter((f) => f.check === 'worklog-timestamp');
const counts = findings.filter((f) => f.check === 'metric-count');
console.log(JSON.stringify({
  audited_at: new Date().toISOString(),
  worklogs_with_timestamps: worklogs.filter((p) => /-\d{4}-/.test(p)).length,
  timestamp_drift_findings: drift.length,
  // Split by sign. A single count hid a second defect behind a first for hours:
  // positive drift means a fabricated timestamp (claimed earlier than the
  // commit), negative means local time written into a UTC-labelled name. They
  // have different causes and different fixes, so they are reported separately.
  timestamp_drift_fabricated: drift.filter((f) => f.drift_minutes > 0).length,
  timestamp_drift_local_time_as_utc: drift.filter((f) => f.drift_minutes < 0).length,
  metric_count_findings: counts.length,
  counts_independently_rederived: countsChecked,
  declared_derivations_rederived: declaredChecked,
  declared_derivations_unavailable: declaredUnavailable,
  derivation_sources_checked: sourcesChecked,
  metrics_files_seen: metricsFiles.length,
  metrics_files_untracked: untrackedMetrics.length,
  documented_commands_checked: documentedCommands,
  findings,
}, null, 2));

// Advisory by default: these are historical records, and rewriting committed
// history to satisfy a checker would be worse than carrying an honest note.
// --strict makes it a gate for new work.
if (process.argv.includes('--strict') && findings.length) process.exit(3);
