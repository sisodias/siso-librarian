#!/usr/bin/env node
// Evaluates refresh-ledger triggers against real repository state.
//
// The ledger previously recorded freshness as a hand-written assertion: someone
// decided a claim was fresh and typed "fresh". That is not a refresh mechanism,
// it is a note. This evaluates each entry's declared invalidate_on triggers
// against git history since checked_at, so staleness is detected rather than
// asserted.
//
// Read-only. Reports; never rewrites the ledger.
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const ledgerPath = 'refresh/ledger.json';

// Maps a declared trigger phrase to the repo paths whose changes would fire it.
// Unmapped triggers are reported as unevaluatable rather than silently passing —
// a trigger nobody can check is worse than no trigger, because it looks covered.
const TRIGGER_PATHS = {
  'schema change': ['schemas/', 'scripts/verify-claim-packets.mjs'],
  'new evidence source': ['sources/'],
  'approved action status change': ['claims/'],
};

function gitCommitsSince(since, paths) {
  try {
    const out = execFileSync('git', ['log', `--since=${since}`, '--format=%h %s', '--', ...paths], {
      cwd: root, encoding: 'utf8',
    }).trim();
    return out ? out.split('\n') : [];
  } catch {
    return [];
  }
}

if (!existsSync(ledgerPath)) {
  console.error('no refresh ledger found');
  process.exit(1);
}

const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));
const findings = [];

for (const entry of ledger.entries || []) {
  const fired = [];
  const unevaluatable = [];

  for (const trigger of entry.invalidate_on_considered || []) {
    const paths = TRIGGER_PATHS[trigger];
    if (!paths) { unevaluatable.push(trigger); continue; }
    const commits = gitCommitsSince(entry.checked_at, paths);
    if (commits.length) fired.push({ trigger, commits, count: commits.length });
  }

  const derived = fired.length ? 'stale' : (unevaluatable.length ? 'unknown' : 'fresh');

  // Only NEW drift is a disagreement. An entry already recorded as stale or
  // blocked is an acknowledged debt, not undetected drift — flagging it would
  // make the gate cry wolf until someone refreshes the grounding, which is
  // exactly the pressure that gets gates disabled. What must never pass
  // silently is an entry claiming "fresh" while its triggers have fired.
  const acknowledged = ['stale', 'blocked', 'superseded'].includes(entry.result);
  const agrees = derived === entry.result || (acknowledged && derived === 'fresh');

  findings.push({
    claim_packet: entry.claim_packet,
    question_id: entry.question_id,
    checked_at: entry.checked_at,
    recorded_result: entry.result,
    derived_result: derived,
    agrees,
    acknowledged_debt: acknowledged && derived === 'fresh',
    triggers_fired: fired,
    triggers_unevaluatable: unevaluatable,
  });
}

const disagreements = findings.filter((f) => !f.agrees);
console.log(JSON.stringify({
  evaluated_at: new Date().toISOString(),
  entries_evaluated: findings.length,
  disagreements: disagreements.length,
  findings,
}, null, 2));

// Non-zero when the ledger's recorded state disagrees with reality, so this can
// gate CI. Drift becomes loud instead of silently accumulating.
if (disagreements.length) {
  console.error(`\n${disagreements.length} ledger entr(y|ies) disagree with repository state`);
  process.exit(2);
}
