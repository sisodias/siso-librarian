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
  // schemas/ only. Including the verifier meant that hardening a GATE marked
  // every claim stale — 10 at once on 2026-08-04 — even though no schema and no
  // evidence had moved. A checker getting stricter is not a reason to doubt the
  // things it checks, and a trigger that fires on maintenance trains you to
  // dismiss it.
  'schema change': ['schemas/'],
  // Adapter CONTRACTS, not every file under sources/. Measured 2026-08-05:
  // ingesting 101 books rewrote sources/internet-archive/want-list-weak-subjects.json
  // and marked all 10 claims stale, blocking a push — over a file that exactly
  // ZERO claims ground in. The only grounding under sources/ cites
  // adapter-contract.json.
  //
  // Same defect the 'schema change' comment above describes, and the same fix:
  // watch what a claim can actually ground in. A want-list is an input to the
  // ingest, not evidence for a position — and every future ingest would have
  // tripped this, so the cost was a permanent treadmill, not one bad push.
  'new evidence source': ['sources/**/adapter-contract.json', 'sources/**/*contract*.json'],
  'approved action status change': ['claims/'],
  // GQ-001 is a claim ABOUT the enforcement layer, so the enforcement layer is
  // its evidence. Measured 2026-08-05: the v2 packet declared these three
  // triggers, none were in this map, and evaluate-refresh correctly derived
  // "unknown" against a recorded "fresh" — it will not certify freshness it
  // cannot check. Registering them here is the honest fix; deleting them from
  // the claim would have bought a green gate by asking it less.
  //
  // Narrow on purpose, per the two comments above: the verify chain lives in
  // package.json and the case counts live in the two self-test scripts. Watching
  // all of scripts/ would fire on every edit I make and become the treadmill
  // those comments warn about.
  'verify chain change': ['package.json'],
  'self-test case count change': ['scripts/gate-selftest.sh', 'scripts/rebuild-selftest.sh'],
  'a push blocked or not blocked by the hook': ['.githooks/pre-push'],
};

// This gate derives staleness ENTIRELY from git. If git cannot answer, it has
// measured nothing — and the catch below used to turn that into an empty commit
// list, which is indistinguishable from "no triggers fired". Running the gate
// outside a repository therefore reported all 10 entries fresh and exited 0:
// maximum confidence from zero information.
//
// Found by the gate self-test on 2026-08-04, which ran it in a scratch copy
// with no .git. The harness caused that particular case, but the swallow is
// real — a corrupted index or a gate invoked from the wrong cwd would produce
// the same silent all-clear on the live repo.
function assertGitUsable() {
  try {
    execFileSync('git', ['rev-parse', '--git-dir'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch {
    console.error('evaluate-refresh: not a git repository — this gate derives staleness from git history,');
    console.error('so it cannot evaluate anything here. Refusing to report "fresh" from no evidence.');
    process.exit(3);
  }
}

function gitCommitsSince(since, paths) {
  try {
    // HEAD is excluded deliberately. The commit that introduces or refreshes a
    // ledger entry necessarily touches claims/ or schemas/, so counting it would
    // make every entry invalidate itself the moment it was written — drift that
    // is an artifact of recording, not of the world changing.
    const out = execFileSync('git', ['log', `--since=${since}`, 'HEAD~1', '--format=%h %s', '--', ...paths], {
      cwd: root, encoding: 'utf8',
    }).trim();
    return out ? out.split('\n') : [];
  } catch (err) {
    // A single legitimate case reaches here: a repository with one commit, where
    // HEAD~1 does not resolve. That genuinely means no prior commits could have
    // fired a trigger, so an empty list is the correct answer.
    //
    // Anything else — a bad path, a corrupted index, an unreadable object — is a
    // FAILURE TO MEASURE, and returning [] would launder it into "nothing fired".
    // That is how this gate came to report ten entries fresh while knowing
    // nothing at all.
    const msg = String(err?.stderr || err?.message || '');
    if (/unknown revision|ambiguous argument|bad revision/i.test(msg)) return [];
    console.error(`evaluate-refresh: git failed while evaluating ${paths.join(', ')}: ${msg.trim().split('\n')[0]}`);
    process.exit(3);
  }
}

assertGitUsable();

// SYNTHETIC HISTORY IS UNMEASURABLE, NOT STALE. assertGitUsable catches git being
// BROKEN; it passes happily on a scratch copy with one synthetic commit that
// touched every watched path at once — so all triggers fire and every claim
// reads stale for a reason that has nothing to do with the claims.
//
// That is why gates-are-load-bearing EXCLUDES this gate, which means its
// removal has never been tested: it is the one gate in the chain nobody can
// prove is load-bearing. Measured 2026-08-06.
//
// Detecting it here rather than relying on the caller is the same fix applied to
// audit-asserted-numbers earlier today. An exclusion list is a thing callers
// forget; a self-check travels with the gate. One commit is the signature —
// a real history here is in the thousands.
const commitCount = Number((() => {
  try { return execFileSync('git', ['rev-list', '--count', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(); }
  catch { return '0'; }
})());
if (commitCount > 0 && commitCount < 10) {
  console.log(JSON.stringify({
    skipped: true,
    reason: `git history has ${commitCount} commit(s) — every watched path would appear to have changed at once, so no trigger can be evaluated.`,
    note: 'SKIPPED, not passed. No claim was checked.',
  }, null, 2));
  process.exit(0);
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
    let paths = TRIGGER_PATHS[trigger];
    if (!paths) { unevaluatable.push(trigger); continue; }
    // "approved action status change" is about THIS claim's action, not any
    // claim's. Scoping it to the directory meant adding an unrelated claim
    // marked every existing one stale — drift that is an artifact of the
    // registry growing, which would make the gate fire on every new question.
    if (trigger === 'approved action status change') paths = [entry.claim_packet];
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
