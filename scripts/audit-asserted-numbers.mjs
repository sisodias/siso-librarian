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
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
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

function deriveCount(d) {
  if (d.kind === 'sqlite') {
    if (!existsSync(d.source)) return null;
    return Number(execFileSync('sqlite3', [`file:${d.source}?mode=ro`, d.query], { encoding: 'utf8' }).trim());
  }
  if (d.kind === 'file-count') {
    if (!existsSync(d.source)) return 0;
    const out = execFileSync('find', [d.source, '-type', 'f', '-name', d.query], { encoding: 'utf8' }).trim();
    return out ? out.split('\n').length : 0;
  }
  if (d.kind === 'json-length') {
    if (!existsSync(d.source)) return null;
    const doc = JSON.parse(readFileSync(d.source, 'utf8'));
    const key = d.query.replace('[]', '');
    return Array.isArray(doc?.[key]) ? doc[key].length : null;
  }
  return null;
}

if (existsSync(SNAPSHOT)) {
  const snap = JSON.parse(readFileSync(SNAPSHOT, 'utf8'));
  for (const [label, d] of Object.entries(snap.derivations || {})) {
    const [group, key] = label.split('.');
    const asserted = snap?.bucket_counts?.[group]?.[key];
    if (typeof asserted !== 'number') continue;
    let derived = null;
    try { derived = deriveCount(d); } catch { derived = null; }
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

const drift = findings.filter((f) => f.check === 'worklog-timestamp');
const counts = findings.filter((f) => f.check === 'metric-count');
console.log(JSON.stringify({
  audited_at: new Date().toISOString(),
  worklogs_with_timestamps: worklogs.filter((p) => /-\d{4}-/.test(p)).length,
  timestamp_drift_findings: drift.length,
  metric_count_findings: counts.length,
  counts_independently_rederived: countsChecked,
  findings,
}, null, 2));

// Advisory by default: these are historical records, and rewriting committed
// history to satisfy a checker would be worse than carrying an honest note.
// --strict makes it a gate for new work.
if (process.argv.includes('--strict') && findings.length) process.exit(3);
