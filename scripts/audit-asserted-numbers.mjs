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
import { basename, join, relative } from 'node:path';
import { groundingSourceId } from './lib/claim-paths.mjs';
import { resolveLabel, labelForPath } from './lib/snapshot-paths.mjs';

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
  // Verified inert on 2026-08-04: all 97 timestamped worklogs have an
  // add-commit. But a file with none would be dropped from the timestamp check
  // silently — the one way a fabricated timestamp could escape the gate that
  // exists specifically to catch fabricated timestamps.
  if (!added) {
    findings.push({ check: 'worklog-no-add-commit', path,
      note: 'Claims a timestamp in its filename but git has no add-commit for it, so the claim could not be checked against anything.' });
    continue;
  }
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
  // For file-exists, a missing path IS the answer (false), not an absent
  // measurement — returning null here would make "this path does not exist"
  // unverifiable, which is exactly the fact GQ-004 asserts about the package
  // its documentation names.
  if (!existsSync(src)) {
    if (d.kind === 'file-exists') return false;
    return d.kind === 'file-count' ? 0 : null;
  }
  switch (d.kind) {
    case 'sqlite': {
      // `mode=ro` fails with "unable to open database file (14)" on SOME vault
      // databases. My first explanation — "the external volume refuses sidecars"
      // — was too broad and wrong: the vaulted passage index opens fine either
      // way. The real discriminator is the SQLite header:
      //
      //   passages.sqlite            write_version 1  -> mode=ro works
      //   logs-<stamp>.db            write_version 2  -> mode=ro fails
      //
      // Version 2 means WAL, so a read-only open still wants to create a -shm
      // file beside it, which the copy's directory does not permit. immutable=1
      // tells SQLite the file cannot change and no shared-memory index is
      // needed.
      //
      // Correct for archives specifically — snapshots nothing writes to. NOT
      // applied to live databases, where it would let the audit read a stale
      // page and agree with a number that has already moved.
      //
      // immutable=1 is correct for archives specifically: they are snapshots
      // nothing writes to. It is NOT applied to live databases, where it would
      // let the audit read a stale page and agree with a number that has moved.
      const archived = src.startsWith('/Volumes/');
      const uri = archived ? `file:${src}?mode=ro&immutable=1` : `file:${src}?mode=ro`;
      // A within-run cache was tried here on 2026-08-05 and REMOVED: all 11
      // sqlite derivations are DISTINCT (uri, query) pairs, so a cache can
      // never hit. It appeared to cut the audit 25s -> 3s, but that number came
      // from `sqliteCache` being referenced and never declared — a
      // ReferenceError that made the audit skip work rather than do it faster.
      // Declaring it properly restored the honest 32s.
      //
      // The real cost is one query: `select count(*) from passage` over 41.5M
      // rows, 15.3s, and it is unavoidable here. max(rowid) returns the same
      // number in 4ms and is NOT used — rowids gap the moment a row is deleted,
      // so it would silently overstate. A correct slow answer beats a fast one
      // that can lie.
      return Number(execFileSync('sqlite3', [uri, d.query], { encoding: 'utf8' }).trim());
    }
    case 'file-count': {
      const out = execFileSync('find', [src, '-type', 'f', '-name', d.query], { encoding: 'utf8' }).trim();
      return out ? out.split('\n').length : 0;
    }
    // Non-numeric facts about what is actually installed on this machine.
    // `derive` returning null means "unavailable", so file-exists must return a
    // boolean and never null — a missing path is the answer `false`, not an
    // absent measurement.
    case 'file-exists':
      return existsSync(src);
    case 'json-field': {
      const doc = JSON.parse(readFileSync(src, 'utf8'));
      const v = String(d.query).split('.').reduce((o, k) => (o == null ? undefined : o[k]), doc);
      return v === undefined ? null : v;
    }
    // Count files in a directory whose claim.status matches (or, with a leading
    // '!', does not match) any of the given values. Claim counts were among the
    // 20 undeclared numbers, and a disputed claim was being published as live
    // because nothing re-derived them.
    case 'json-status-count': {
      const wanted = String(d.query).split(',').map((s) => s.trim());
      const negate = wanted[0].startsWith('!');
      const set = new Set(wanted.map((s) => s.replace(/^!/, '')));
      return readdirSync(src).filter((f) => f.endsWith('.json')).filter((f) => {
        let st;
        // `return false` would silently exclude a corrupt claim from the count,
        // shrinking claims_live without any finding. Throw so derive() reports
        // the derivation as unavailable instead of confidently wrong.
        try { st = JSON.parse(readFileSync(join(src, f), 'utf8'))?.claim?.status; }
        catch (err) { throw new Error(`unparseable claim ${f}: ${err.message}`); }
        return negate ? !set.has(st) : set.has(st);
      }).length;
    }
    // Count JSON files in a directory satisfying a predicate over their
    // contents. Written for the God Question coverage numbers, where "has a
    // testable contract" means several arrays are all non-empty — a condition
    // no file count can express.
    //
    // The predicate is a restricted mini-language, NOT eval: `a.b.c` walks the
    // object, `+` requires non-empty, `?` requires present. Accepting arbitrary
    // JS here would mean the audit could be made to agree with anything by
    // writing a clever enough declaration.
    case 'json-predicate-count': {
      const [glob, ...terms] = String(d.query).split(/\s+/);
      const re = new RegExp('^' + glob.replace(/[.]/g, '\\.').replace(/\*/g, '.*') + '$');
      return readdirSync(src).filter((f) => re.test(f)).filter((f) => {
        let doc;
        try { doc = JSON.parse(readFileSync(join(src, f), 'utf8')); }
        catch (err) { throw new Error(`unparseable predicate source ${f}: ${err.message}`); }
        return terms.every((t) => {
          const mode = t.slice(-1);
          const path = t.slice(0, -1);
          const v = path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), doc);
          if (mode === '+') return Array.isArray(v) ? v.length > 0 : v != null && v !== '';
          if (mode === '?') return v !== undefined;
          return false;
        });
      }).length;
    }
    // Distinct values of a field across JSON files in one directory, optionally
    // intersected against ids present in another. This is the cross-directory
    // join the release-integrity numbers need — "works referenced by a release"
    // cannot be counted by looking at either directory alone.
    case 'json-join-count': {
      const [glob, field, mode, otherDir] = String(d.query).split(/\s+/);
      const re = new RegExp('^' + glob.replace(/[.]/g, '\\.').replace(/\*/g, '.*') + '$');
      const refs = new Set();
      // A corrupt file here used to be skipped silently, so the join measured a
      // SMALLER registry and agreed with itself — no mismatch, no finding,
      // checks_skipped 0. Meanwhile file-count still counts the corrupt file, so
      // two derivations over the same directory disagree invisibly.
      // Throwing makes derive() return null, which the caller already reports as
      // an unavailable derivation rather than a silent pass.
      for (const f of readdirSync(src).filter((x) => re.test(x))) {
        let doc;
        try { doc = JSON.parse(readFileSync(join(src, f), 'utf8')); }
        catch (err) { throw new Error(`unparseable source file ${f}: ${err.message}`); }
        const v = field.split('.').reduce((o, k) => (o == null ? undefined : o[k]), doc);
        for (const item of [].concat(v || [])) if (item) refs.add(String(item));
      }
      if (!mode) return refs.size;
      const other = String(otherDir).replace(/^~/, process.env.HOME);
      if (!existsSync(other)) return null;
      const have = new Set();
      for (const f of readdirSync(other).filter((x) => x.endsWith('.json'))) {
        let doc;
        try { doc = JSON.parse(readFileSync(join(other, f), 'utf8')); }
        catch (err) { throw new Error(`unparseable join target ${f}: ${err.message}`); }
        // Ids ONLY. Adding the filename as a fallback key doubled the set with
        // entries that no reference could ever match, which made
        // works_without_releases read 25 against a true 0 — a checker inventing
        // 25 phantom works and confidently reporting every one as orphaned.
        if (doc?.id) have.add(String(doc.id));
      }
      if (mode === 'intersect') return [...refs].filter((r) => have.has(r)).length;
      if (mode === 'missing') return [...refs].filter((r) => !have.has(r)).length;
      if (mode === 'unreferenced') return [...have].filter((h) => !refs.has(h)).length;
      return null;
    }
    // Count regex matches in a text file. The decisions-awaiting count lives in
    // a markdown proposal, and nothing else could re-derive it.
    case 'text-match-count': {
      const m = readFileSync(src, 'utf8').match(new RegExp(d.query, 'gm'));
      return m ? m.length : 0;
    }
    case 'glob-exists': {
      // Whether any entry in a directory matches — e.g. did a package ship a
      // LICENSE file, under whatever capitalisation.
      if (!statSync(src).isDirectory()) return false;
      const re = new RegExp(d.query, 'i');
      return readdirSync(src).some((f) => re.test(f));
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
    // Point-in-time repo counts. A session's commit and worklog totals grow, so
    // a live count reports a permanent false mismatch against any snapshot; the
    // query carries the commit that was HEAD when the number was taken.
    case 'git-rev-count':
      return Number(execFileSync('git', ['rev-list', '--count', String(d.query)],
        { cwd: root, encoding: 'utf8' }).trim());
    case 'git-ls-count': {
      const [ref, dir, ext] = String(d.query).split(/\s+/);
      const out = execFileSync('git', ['ls-tree', '-r', '--name-only', ref, dir],
        { cwd: root, encoding: 'utf8' }).trim();
      if (!out) return 0;
      return out.split('\n').filter((f) => !ext || f.endsWith(ext)).length;
    }
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
  // For file-exists, a missing path IS the measurement — GQ-004 asserts that the
  // package its documentation names is NOT installed. Flagging that as a missing
  // source reports the finding itself as a defect, which would train me to
  // ignore this check.
  if (d.kind === 'file-exists') return;
  if (!existsSync(src)) {
    findings.push({ check: 'derivation-source-missing', file, label, source: d.source, kind: d.kind,
      note: 'Source path does not exist. A file-count over a missing directory silently yields 0.' });
  }
}

// Coverage, not just correctness. Every check above verifies that a DECLARED
// number matches its source; none asked how many published numbers declare
// nothing at all. That is the gap behind three consecutive loops of the same
// defect — "7 claims awaiting review" hid a re-derivable half, "2 escalations
// undelivered" were on the remote, "3 channels" were two sharing one peer.
// Each figure was defensible and none was measuring what its name implied,
// because nothing required them to name a source.
//
// This reports the ratio rather than failing on it: several snapshot numbers
// are genuinely un-derivable in principle (a live ssh probe result, a count of
// unreadable files) and demanding a derivation for those would push me to
// invent one that re-reads the stored value — the exact failure the
// reproducible/derivable split exists to prevent.
let snapshotNumbers = 0;
let snapshotUndeclared = [];
if (existsSync(SNAPSHOT)) {
  const snap = JSON.parse(readFileSync(SNAPSHOT, 'utf8'));
  const declared = new Set(Object.keys(snap.derivations || {}));
  const walkNums = (o, p = '') => {
    if (o && typeof o === 'object' && !Array.isArray(o)) {
      for (const [k, v] of Object.entries(o)) walkNums(v, p ? `${p}.${k}` : k);
    } else if (typeof o === 'number' && Number.isFinite(o)) {
      if (p.startsWith('derivations')) return;
      snapshotNumbers += 1;
      // Derivation keys are `group.key`; snapshot paths carry a bucket_counts
      // prefix. Matching the raw path reported 42 undeclared when the true
      // figure is 24 — a checker measuring the wrong key disagrees confidently.
      if (!declared.has(labelForPath(p))) snapshotUndeclared.push(p);
    }
  };
  walkNums(snap);
  // Each undeclared number must carry a written reason, and the rationale list
  // must not outlive the numbers it explains. Without both directions a stale
  // rationale would keep vouching for a path that no longer exists, and a new
  // undeclared number would inherit the appearance of having been considered.
  const rationale = snap.undeclared_rationale || {};
  const unexplained = snapshotUndeclared.filter((p) => !rationale[p]);
  const orphanRationale = Object.keys(rationale).filter((p) => !snapshotUndeclared.includes(p));
  if (unexplained.length) {
    findings.push({ check: 'snapshot-undeclared-unexplained', count: unexplained.length, paths: unexplained,
      note: 'Published with no derivation AND no rationale. Every undeclared number must say why it cannot be derived, or "un-derivable" becomes a place to hide unfinished work.' });
  }
  if (orphanRationale.length) {
    findings.push({ check: 'snapshot-rationale-orphaned', count: orphanRationale.length, paths: orphanRationale,
      note: 'Rationale for a path that is no longer undeclared. Stale explanations vouch for numbers nobody is checking.' });
  }
  if (snapshotUndeclared.length) {
  // A list rendered as a COUNT is a class of defect, not an instance. Twice this
  // session the page showed "N queued" or "N awaiting" while the content lived
  // only in the raw JSON dump at the bottom — first for escalations, then for
  // decisions, built by the same function, one table row apart. With zero
  // working push routes the observatory is the only channel that reaches Shaan,
  // so a count he cannot act on is worse than nothing.
  //
  // Compares against the page ABOVE "Raw snapshot", since everything appears
  // below it by definition. HTML-escapes the needle: the first version of this
  // check reported the escalation headlines as hidden because "->" renders as
  // "-&gt;".
  const pagePath = 'public/index.html';
  if (existsSync(pagePath)) {
    const page = readFileSync(pagePath, 'utf8');
    const readable = page.slice(0, page.indexOf('Raw snapshot') >>> 0 || page.length);
    const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const lists = {
      'awaiting_decision.items': snap.awaiting_decision?.items,
      'escalations.headlines': (snap.escalations?.headlines || []).map((h) => h.title),
      'god_questions.questions': (snap.god_questions?.questions || []).map((q) => q.title),
      'active_questions': (snap.active_questions || []).map((q) => q.text),
    };
    for (const [label, list] of Object.entries(lists)) {
      if (!Array.isArray(list) || !list.length) continue;
      const first = esc(String(list[0])).slice(0, 24);
      if (first && !readable.includes(first)) {
        findings.push({ check: 'list-rendered-as-count', field: label, items: list.length,
          note: 'This list is published on the observatory as a count only — its contents appear nowhere above the raw JSON dump. With no working push channel, a count Shaan cannot act on is the defect.' });
      }
    }
  }

    findings.push({ check: 'snapshot-undeclared-numbers', severity: 'info',
      count: snapshotUndeclared.length, of: snapshotNumbers,
      explained: snapshotUndeclared.length - unexplained.length,
      derivable_not_yet: Object.values(rationale).filter((r) => String(r).startsWith('derivable')).length,
      genuinely_underivable: Object.values(rationale).filter((r) => String(r).startsWith('un-derivable')).length,
      paths: snapshotUndeclared,
      note: 'Published on the observatory with no declared derivation. Not necessarily wrong — some are un-derivable in principle — but nothing re-derives them, so a wrong one would stay wrong silently.' });
  }
}

if (existsSync(SNAPSHOT)) {
  const snap = JSON.parse(readFileSync(SNAPSHOT, 'utf8'));
  for (const [label, d] of Object.entries(snap.derivations || {})) {
    checkSourceExists(label, d, SNAPSHOT);
    // Resolution lives in lib/snapshot-paths.mjs. It was hand-rolled at three
    // call sites and got the prefix wrong at two of them — each wrong copy
    // agreeing with itself rather than erroring.
    const asserted = resolveLabel(snap, label);
    // A DECLARED derivation whose label does not resolve is the worst case in
    // this file: someone wrote down how to check a number, and the check
    // silently does nothing. That is how repo_health.scripts_on_disk sat at 17
    // against a real 18 for an unknown length of time — skipped, never
    // compared, and invisible because a skip left no trace.
    if (typeof asserted !== 'number') {
      findings.push({ check: 'declared-derivation-unresolvable', file: SNAPSHOT, label,
        resolved_to: asserted === undefined ? 'undefined' : typeof asserted,
        note: 'Declared in derivations but its label resolves to no number in the snapshot, so nothing was checked.' });
      continue;
    }
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
  // A file in claims/ that is not .json is skipped from the grounded-evidence
  // set silently. Verified 2026-08-04: dropping a claim in as `.json.bak`
  // produced no finding at all — and `.json.bak` is exactly what my own backup
  // habit creates before an edit. A claim saved under the wrong extension stops
  // protecting its evidence and nothing says so.
  if (!cf.endsWith('.json')) {
    findings.push({ check: 'claims-dir-non-json', file: relative(root, cf),
      note: 'Present in claims/ but not a .json file, so it is excluded from the grounded-evidence set. If this is a claim, its evidence is unaudited; if it is a stray backup, it should not live here.' });
    continue;
  }
  let cd;
  // An unparseable CLAIM file used to vanish here. The claim-packet verifier
  // does catch it (exit 1), so it cannot reach a push — but this audit exited 0
  // and reported success while silently dropping that claim from
  // groundedMetrics, which means its evidence stopped being audited and nothing
  // said so. Two gates disagreeing about whether the repo is healthy is worse
  // than either failing alone.
  try { cd = JSON.parse(readFileSync(cf, 'utf8')); } catch (err) {
    findings.push({ check: 'claim-unparseable', file: relative(root, cf),
      note: `Could not be parsed as JSON, so its grounding and evidence were not audited: ${String(err.message).slice(0, 100)}` });
    continue;
  }
  const status = cd?.claim?.status;
  if (status === 'superseded' || status === 'disputed') continue;
  for (const g of cd?.grounding || []) {
    // via lib/claim-paths.mjs — one place knows this shape. I mis-keyed it five
    // times on 2026-08-04 writing throwaway readers; the production code was
    // always right, so the fix is making the correct reader the reachable one.
    const id = groundingSourceId(g);
    if (typeof id === 'string' && id.startsWith('metrics/')) groundedMetrics.add(id);
  }
}

for (const file of metricsFiles) {
  if (!existsSync(file)) continue;
  let doc;
  // An unparseable metrics file used to vanish from this audit entirely. If a
  // live claim grounds in it, that is a claim whose evidence cannot even be
  // read — strictly worse than evidence that disagrees, and it was reported as
  // nothing at all.
  try { doc = JSON.parse(readFileSync(file, 'utf8')); } catch (err) {
    findings.push({ check: 'metrics-unparseable', file,
      grounded: groundedMetrics.has(file),
      note: `Could not be parsed as JSON: ${String(err.message).slice(0, 120)}` });
    continue;
  }
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
      // "Reproducible" and "derivable" are different states, and collapsing
      // them was making this gate lie in both directions. A DERIVATION re-reads
      // a source that already holds the answer; an EXPERIMENT issues fresh
      // requests and can contradict the stored result. GQ-008's cache finding
      // can only ever be the second — no query reproduces it, because the
      // evidence is what two gateways do when asked, not what a log recorded.
      //
      // Before this, such a file was reported identically to one whose author
      // simply never wrote the block, which meant the only ways to clear it
      // were to leave it flagged forever or to invent a derivation kind that
      // quietly re-read the stored result and turned the gate green while
      // checking nothing.
      //
      // A `reproduced_by` script is accepted as evidence ONLY if it exists on
      // disk. An unrunnable pointer is worth less than an honest gap, because
      // it reads as covered.
      const script = typeof doc.reproduced_by === 'string' ? doc.reproduced_by : null;
      if (script && existsSync(join(root, script))) {
        findings.push({ check: 'metrics-reproducible-not-derivable', file, reproduced_by: script,
          severity: 'info',
          note: 'No derivations block, and correctly so: this records a live experiment. Re-run the named script to reproduce; a query cannot.' });
      } else if (script) {
        findings.push({ check: 'metrics-reproducer-missing', file, reproduced_by: script,
          note: 'Names a reproducer that does not exist on disk. A pointer to a missing script reads as covered while checking nothing.' });
      } else {
        findings.push({ check: 'metrics-underived', file,
          note: 'A live claim grounds in this file, but it declares no derivations and names no reproducer, so none of its numbers can be checked. Add a derivations block, or a reproduced_by script if only a live experiment can produce them.' });
      }
    }
    continue;
  }
  for (const [dotted, d] of Object.entries(doc.derivations)) {
    checkSourceExists(dotted, d, file);
    const asserted = resolvePath(doc, dotted);
    // Strings and booleans are checkable too. Restricting this to numbers meant
    // a declared derivation over a non-numeric fact was SKIPPED SILENTLY — the
    // same shape as the missing-derivations skip and the bucket_counts skip.
    // GQ-004's evidence is mostly non-numeric (an installed package name, a
    // licence field, whether a LICENSE file shipped), so declaring derivations
    // for it under the old guard would have been decorative: present in the
    // file, checking nothing, and reported as success.
    if (asserted === null || asserted === undefined || typeof asserted === 'object') continue;
    let derived = null;
    try { derived = derive(d); } catch { derived = null; }
    if (derived === null) {
      declaredUnavailable += 1;
      findings.push({ check: 'declared-derivation', file, path: dotted, asserted, derived: 'unavailable', status: 'source_missing' });
      continue;
    }
    declaredChecked += 1;
    if (derived !== asserted) {
      const finding = { check: 'declared-derivation', file, path: dotted, asserted, derived };
      if (typeof derived === 'number' && typeof asserted === 'number') finding.delta = derived - asserted;
      findings.push(finding);
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
    // A README must INVOKE the script, not merely name it. Measured 2026-08-04:
    // appending "We once considered scripts/orphan-probe.mjs but abandoned it."
    // marked that script as referenced — a sentence saying it was ABANDONED
    // satisfied the reachability check. Require the path inside a command
    // (fenced block, `node scripts/x`, `bash scripts/x`) or an npm script.
    const invoked = new RegExp(`(?:node|bash|sh|npm run [\\w:-]+\\s*#?[^\\n]*)\\s+${rel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    // A library is reachable by IMPORT, not invocation. lib/snapshot-paths.mjs
    // is imported by this very file and was flagged as an orphan by the first
    // version of this fix — tightening a check is not free, and the tightened
    // rule must still model how the code is actually reached.
    const importedBy = walk(join(root, 'scripts')).some((g) => g !== f && /\.(mjs|js)$/.test(g)
      && new RegExp(`from\\s+['"\`][^'"\`]*${basename(rel).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`).test(readFileSync(g, 'utf8')));
    const referenced = importedBy || invoked.test(readme) || [...scripts].some((k) =>
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
  // Skips, counted. Every silent-skip defect this session shared one property:
  // the audit reported success while having examined less than it appeared to,
  // and nothing distinguished "checked and clean" from "never looked". These
  // two numbers make that distinction visible at a glance.
  checks_skipped: findings.filter((f) => f.check === 'declared-derivation-unresolvable'
    || f.check === 'metrics-unparseable' || f.check === 'claim-unparseable').length,
  snapshot_numbers_published: snapshotNumbers,
  snapshot_numbers_undeclared: snapshotUndeclared.length,
  findings,
}, null, 2));

// Advisory by default: these are historical records, and rewriting committed
// history to satisfy a checker would be worse than carrying an honest note.
// --strict makes it a gate for new work.
if (process.argv.includes('--strict') && findings.length) process.exit(3);
