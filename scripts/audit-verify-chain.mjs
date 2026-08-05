#!/usr/bin/env node
// Guard the gate chain itself against being silently disabled.
//
// WHY. Measured 2026-08-05: appending `|| true` to the verify script makes a
// repo with a deliberately corrupted claim exit 0 instead of 1. Two words in
// package.json turn every gate into decoration, and nothing in this repo would
// notice — every other check inspects artifacts, and this one lives in the
// configuration that runs them.
//
// It is the same shape as the defects that have cost the most here: a checker
// that reads a narrower thing than it claims to check. The gates check the
// repo; nothing checked the gates' invocation.
//
// WHAT IT REJECTS
//   - `|| true`, `|| exit 0`, `; true` — swallow a failure
//   - `|| :` — the same, in its terser form
//   - a gate named in the chain that is not on disk
//   - a gate on disk, in the expected set, missing from the chain
//
// The last one matters most: a gate silently dropped from the chain still sits
// in scripts/ looking like coverage.
//
//   audit-verify-chain.mjs           report
//   audit-verify-chain.mjs --strict  exit non-zero on any finding
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const strict = process.argv.includes('--strict');
const root = process.cwd();
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const chain = pkg.scripts?.verify || '';
const findings = [];

if (!chain) {
  findings.push({ kind: 'no-verify-script', why: 'package.json has no verify script — there is no gate chain at all' });
}

// Failure-swallowing constructs. Checked against the raw string because that IS
// the thing that runs; there is no "prose vs code" distinction in a shell
// command, which is what makes this one simple.
const SWALLOW = [
  { re: /\|\|\s*true\b/, name: '|| true' },
  { re: /\|\|\s*:/, name: '|| :' },
  { re: /\|\|\s*exit\s+0\b/, name: '|| exit 0' },
  { re: /;\s*true\s*$/, name: '; true' },
  { re: /\|\|\s*echo\b/, name: '|| echo' },
];
for (const s of SWALLOW) {
  if (s.re.test(chain)) {
    findings.push({
      kind: 'chain-swallows-failure',
      construct: s.name,
      why: `\`${s.name}\` makes the chain exit 0 even when a gate fails. Verified 2026-08-05: a repo with a corrupted claim exits 1 with an intact chain and 0 with this appended.`,
    });
  }
}

// Every gate named in the chain must exist.
const named = [...chain.matchAll(/node\s+(scripts\/[\w.-]+\.mjs)/g)].map((m) => m[1]);
for (const g of named) {
  if (!existsSync(join(root, g))) {
    findings.push({ kind: 'chain-names-missing-gate', gate: g, why: 'named in verify but not on disk' });
  }
}

// And every gate that LOOKS like a gate must be in the chain. A gate dropped
// from the chain still sits in scripts/ reading as coverage — the silent
// version of the same defect.
const EXPECTED = [
  'scripts/verify-claim-packets.mjs',
  'scripts/evaluate-refresh.mjs',
  'scripts/audit-asserted-numbers.mjs',
  'scripts/derivation-sensitivity.mjs',
  'scripts/audit-source-coverage.mjs',
];
for (const g of EXPECTED) {
  if (existsSync(join(root, g)) && !named.includes(g)) {
    findings.push({
      kind: 'gate-dropped-from-chain',
      gate: g,
      why: 'present in scripts/ but absent from the verify chain — it looks like coverage and runs never',
    });
  }
}

// Is the hook actually wired? core.hooksPath is per-clone config, not tracked
// content, so a fresh clone has the hook FILE and no hook. Measured 2026-08-05:
// that is the residual left after moving hooks into version control, and a
// residual nobody is told about is the same defect as an unreachable mechanism.
try {
  const { execFileSync } = await import('node:child_process');
  const hp = execFileSync('git', ['config', '--get', 'core.hooksPath'], { encoding: 'utf8' }).trim();
  if (hp !== '.githooks') {
    findings.push({
      kind: 'hooks-not-wired',
      found: hp || '(unset)',
      why: 'core.hooksPath is not .githooks, so the tracked pre-push hook does not run. Fix: npm run hooks:install',
    });
  }
} catch {
  findings.push({
    kind: 'hooks-not-wired',
    found: '(unset)',
    why: 'core.hooksPath is unset — the tracked pre-push hook does not run. Fix: npm run hooks:install',
  });
}

// The guard must be able to fail. If EXPECTED drifts from reality it silently
// checks nothing, which is exactly the defect it exists to catch.
const onDisk = EXPECTED.filter((g) => existsSync(join(root, g)));
if (!onDisk.length) {
  findings.push({
    kind: 'expected-set-is-stale',
    why: 'not one gate in the expected set exists — this rule can no longer detect anything. Fix the rule, do not delete it.',
  });
}

console.log(JSON.stringify({
  chain_length: named.length,
  gates_named: named,
  expected_present: onDisk.length,
  findings,
}, null, 2));

if (strict && findings.length) process.exit(4);
