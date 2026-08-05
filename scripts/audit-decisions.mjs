#!/usr/bin/env node
// Re-derive the facts the decision queue asserts, so a decision cannot quietly
// go stale while it sits asking for Shaan's attention.
//
// WHY. Metrics files have a gate that re-derives their declared numbers. The
// prose that ASKS FOR HIS TIME has none. Measured 2026-08-05: of six open
// decisions, two were stale — one described a want-list plan that had since run
// twice (179 books, not the 81 it named), and one quoted pre-eviction log
// numbers after I built and ran the eviction myself.
//
// Both were caught by hand, one turn apart. A stale decision is worse than a
// stale metric: it spends his attention on something already done.
//
// THE CONTRACT. Each entry below names a decision, the fact it asserts, and how
// to re-derive that fact. Facts that cannot be re-derived cheaply are declared
// UNDERIVABLE with a reason, exactly as the observatory does for its numbers —
// "un-derivable" must never become a place to hide.
//
// LIVE CHECKS ARE WARNINGS, NEVER FAILURES. cloudflared being restarted, or the
// log rolling past a threshold, is not a stale decision. Only a number that
// contradicts what the decision CLAIMS is a finding.
//
//   audit-decisions.mjs           report
//   audit-decisions.mjs --strict  exit non-zero on a contradicted claim
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const root = process.cwd();
const FILE = 'proposals/2026-08-04-decisions-awaiting-shaan.md';
const strict = process.argv.includes('--strict');

if (!existsSync(join(root, FILE))) {
  console.log(JSON.stringify({ skipped: true, reason: `${FILE} not present`, note: 'NOT a pass.' }, null, 2));
  process.exit(0);
}
const text = readFileSync(join(root, FILE), 'utf8');

// Open decisions only: struck-through and RESOLVED headings are history.
const open = [...text.matchAll(/^## (\d+)\. (.+)$/gm)]
  .filter((m) => !m[2].startsWith('~~') && !/\bRESOLVED\b/.test(m[2]))
  .map((m) => ({ n: Number(m[1]), heading: m[2] }));

const sh = (cmd) => {
  try { return execFileSync('bash', ['-c', cmd], { encoding: 'utf8', timeout: 20000 }).trim(); }
  catch { return null; }
};

// Each check: what the decision claims, and how to re-derive it. `live` marks a
// fact about a running service — reported, never fatal.
const CHECKS = [
  {
    decision: 1,
    claim: 'the MiniMax route is NOT applied',
    derive: () => {
      const shim = `${process.env.HOME}/.config/bifrost/claude-model-catalog.mjs`;
      if (!existsSync(shim)) return { underivable: 'shim not present' };
      const applied = /8789/.test(readFileSync(shim, 'utf8').split('\n').find((l) => l.includes('const upstream')) || '');
      return { holds: !applied, found: applied ? 'upstream points at the proxy' : 'upstream is Bifrost' };
    },
  },
  {
    decision: 2,
    claim: '5 refs under refs/rescue/',
    derive: () => {
      const n = sh(`git -C "$HOME/SISO_Workspace/SISO_Agency/apps/oracle-streaming" for-each-ref refs/rescue/ 2>/dev/null | wc -l`);
      if (n === null) return { underivable: 'source repo unreachable' };
      return { holds: Number(n) === 5, found: `${Number(n)} refs` };
    },
  },
  {
    decision: 4,
    claim: 'the observatory answers 200 on 8765',
    live: true,
    derive: () => {
      const code = sh(`curl -s --max-time 5 -o /dev/null -w '%{http_code}' http://127.0.0.1:8765/`);
      return { holds: code === '200', found: `HTTP ${code || 'no answer'}` };
    },
  },
  {
    decision: 8,
    claim: '13.7 GB reclaimable across ~/oracle-gate and the literal $HOME dir',
    derive: () => {
      const a = sh(`du -sk "$HOME/oracle-gate" 2>/dev/null | cut -f1`);
      const b = sh(`du -sk "$HOME/SISO_Workspace/SISO_Agency/apps/oracle-streaming/\\$HOME" 2>/dev/null | cut -f1`);
      if (!a) return { underivable: 'oracle-gate not present' };
      const gb = ((Number(a) + Number(b || 0)) / 1048576);
      // Tolerance: du rounds, and the figure is quoted to one decimal.
      return { holds: Math.abs(gb - 13.7) < 0.3, found: `${gb.toFixed(1)} GB` };
    },
  },
];

const findings = [];
const results = [];
for (const c of CHECKS) {
  const present = open.some((o) => o.n === c.decision);
  if (!present) {
    // The decision was resolved or renumbered — the check is now about nothing.
    results.push({ decision: c.decision, status: 'decision-not-open', claim: c.claim });
    continue;
  }
  const r = c.derive();
  if (r.underivable) {
    results.push({ decision: c.decision, status: 'underivable', why: r.underivable, claim: c.claim });
    continue;
  }
  results.push({ decision: c.decision, status: r.holds ? 'holds' : 'CONTRADICTED', claim: c.claim, found: r.found, live: Boolean(c.live) });
  if (!r.holds && !c.live) {
    findings.push({ kind: 'decision-claim-contradicted', decision: c.decision, claim: c.claim, found: r.found });
  }
  if (!r.holds && c.live) {
    findings.push({ kind: 'decision-live-check-differs', decision: c.decision, claim: c.claim, found: r.found, severity: 'warning' });
  }
}

// The rule must be able to fail. If every check maps to a decision that is no
// longer open, this reports clean having verified nothing.
const active = results.filter((r) => r.status === 'holds' || r.status === 'CONTRADICTED').length;
if (!active) {
  findings.push({ kind: 'no-decision-claims-checked', why: 'every check maps to a closed or missing decision — this audit can detect nothing' });
}

console.log(JSON.stringify({
  open_decisions: open.length,
  checks_run: CHECKS.length,
  claims_verified: active,
  results,
  findings,
}, null, 2));

// Warnings do not gate. A restarted service is not a stale decision.
const fatal = findings.filter((f) => f.severity !== 'warning');
if (strict && fatal.length) process.exit(7);
