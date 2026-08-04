#!/usr/bin/env node
// Checks that each declared derivation actually READS the source it names.
//
// Four times in one session the same defect appeared: a checker keyed
// differently from the thing it checks — person_topic vs person_content, a
// bucket_counts. prefix vs a bare key, hyphen vs underscore, work id vs
// filename. Every one produced a CONFIDENT WRONG NUMBER rather than an error,
// and every one was found by accident.
//
// Agreement cannot distinguish them. A derivation that counts the wrong
// directory agrees perfectly whenever the two happen to hold the same number,
// and a derivation whose source vanished agrees with a stale snapshot forever.
//
// So this does not check agreement. It checks SENSITIVITY: point each
// derivation at an empty directory / absent file and require the result to
// CHANGE. A derivation whose output is identical whether its source exists or
// not was never reading it.
//
// Read-only with respect to the repo — it perturbs the DECLARATION (in memory),
// never the source. Nothing on disk is modified.
import { readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const SNAPSHOT = 'observatory/snapshot.json';
if (!existsSync(SNAPSHOT)) { console.error('no snapshot'); process.exit(1); }
const snap = JSON.parse(readFileSync(SNAPSHOT, 'utf8'));
const derivations = snap.derivations || {};

// Reuse the audit's own resolver rather than reimplementing it. A second
// implementation would drift from the first, and then this script would be
// testing a resolver nobody uses.
const AUDIT = 'scripts/audit-asserted-numbers.mjs';
const src = readFileSync(AUDIT, 'utf8');
const fnStart = src.indexOf('function derive(d)');
const fnEnd = src.indexOf('\n}', src.indexOf('switch (d.kind)'));
if (fnStart < 0 || fnEnd < 0) { console.error('could not extract derive() from the audit'); process.exit(2); }
const deriveSrc = src.slice(fnStart, fnEnd + 2);

const mod = new Function('readFileSync', 'existsSync', 'statSync', 'readdirSync', 'execFileSync', 'join',
  `${deriveSrc}; return derive;`);
const { statSync, readdirSync } = await import('node:fs');
const derive = mod(readFileSync, existsSync, statSync, readdirSync, execFileSync, join);

const empty = mkdtempSync(join(tmpdir(), 'sens-'));
const results = [];

for (const [label, d] of Object.entries(derivations)) {
  let real = null;
  try { real = derive(d); } catch { real = null; }
  if (real === null) { results.push({ label, verdict: 'unavailable' }); continue; }

  // Point the same declaration at an empty directory and a path that cannot
  // exist. If neither changes the answer, the source is not being read.
  let onEmpty = null, onAbsent = null;
  try { onEmpty = derive({ ...d, source: empty }); } catch { onEmpty = 'threw'; }
  try { onAbsent = derive({ ...d, source: join(empty, 'definitely-not-here') }); } catch { onAbsent = 'threw'; }

  // A perturbed source that THROWS is not proof of sensitivity. My first
  // version counted 'threw' as movement, and a deliberately insensitive fixture
  // sailed through: it errored on the bad path and looked like it had reacted.
  // Real sensitivity means the derivation still ran and returned a DIFFERENT
  // VALUE — an exception only proves the path was touched, not that its
  // contents were read.
  const changed = (v) => v !== 'threw' && String(v) !== String(real);
  const moved = changed(onEmpty) || changed(onAbsent);
  results.push({ label, kind: d.kind, real, on_empty: onEmpty, on_absent: onAbsent,
    verdict: moved ? 'sensitive' : 'INSENSITIVE' });
}

const insensitive = results.filter((r) => r.verdict === 'INSENSITIVE');
const unavailable = results.filter((r) => r.verdict === 'unavailable');

console.log(JSON.stringify({
  checked_at: new Date().toISOString(),
  derivations: results.length,
  sensitive: results.filter((r) => r.verdict === 'sensitive').length,
  insensitive: insensitive.length,
  unavailable: unavailable.length,
  note: 'A derivation is INSENSITIVE if pointing it at an empty or absent source does not change its answer — it is not reading what it names.',
  insensitive_detail: insensitive,
  unavailable_detail: unavailable.map((r) => r.label),
}, null, 2));

rmSync(empty, { recursive: true, force: true });
if (insensitive.length) process.exit(7);
