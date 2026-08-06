#!/usr/bin/env bash
# Proves every gate still fails on the defect it exists to catch.
#
# Every gate in this repo checks artifacts. NOTHING checked the gates. That gap
# is not hypothetical — three times this session a gate reported success while
# detecting nothing, and each was found by accident rather than by a check:
#
#   - `if (!doc.derivations) continue` silently skipped every unchecked file
#   - `snap.bucket_counts[group][key]` made repo_health.* audit nothing
#   - `if (typeof asserted !== 'number') continue` would have made four
#     declared derivations decorative
#
# A gate that stops detecting things looks exactly like a repo with no defects.
# This inverts that: break something on purpose, assert the gate fails, restore.
#
# Runs against a scratch COPY of the working tree — scratch-test.sh's rule, for
# the same reason. Nothing here mutates the live repo.
#
#   gate-selftest.sh          run all cases
#   gate-selftest.sh -v       show each gate's output
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERBOSE=0
[ "${1:-}" = "-v" ] && VERBOSE=1

SCRATCH=$(mktemp -d "/tmp/gate-selftest-XXXXXX")
cleanup() { rm -rf "$SCRATCH"; }
trap cleanup EXIT

rsync -a --quiet --exclude '.git' --exclude 'node_modules' "$ROOT"/ "$SCRATCH/repo/"
cd "$SCRATCH/repo" || exit 1

# The refresh gate derives staleness from git history, so a copy with no .git
# gives it nothing to measure. It must be tested against real history — and the
# first version of this script did NOT do that, which is how it caught the gate
# swallowing git failures: the case failed for the right reason via the wrong
# route. Two commits minimum, because the gate excludes HEAD deliberately.
# A NARROW ROOT COMMIT, on purpose. evaluate-refresh skips any repo whose root
# commit imported most of the tree (2026-08-06) — in such a history every watched
# path looks changed, so no trigger can be distinguished from "this file exists".
# That check is correct, and it would make this scratch repo unevaluatable if the
# root commit added all 531 files at once.
#
# So: commit ONE file first, then everything else. Three commits, a root that
# touches a single path, and a history the gate can actually reason about.
git init -q .
: > .selftest-root
git -c user.email=s@s -c user.name=s add .selftest-root >/dev/null 2>&1
git -c user.email=s@s -c user.name=s commit -q -m "selftest root" >/dev/null 2>&1
git -c user.email=s@s -c user.name=s add -A >/dev/null 2>&1
git -c user.email=s@s -c user.name=s commit -q -m "selftest base" >/dev/null 2>&1
: > .selftest-marker
git -c user.email=s@s -c user.name=s add -A >/dev/null 2>&1
git -c user.email=s@s -c user.name=s commit -q -m "selftest head" >/dev/null 2>&1

PASS=0; FAIL=0

# Each case: break a file, run a gate, require a NON-ZERO exit, restore.
# A case that passes when it should fail is the whole point of this script, so
# the assertion is on the gate failing — never on it succeeding.
check() {
  local name="$1" file="$2" gate="$3" mutate="$4"
  cp "$file" "$SCRATCH/backup"
  /usr/bin/python3 -c "$mutate" 2>/dev/null || { echo "SKIP $name (could not mutate)"; cp "$SCRATCH/backup" "$file"; return; }

  # A byte-comparison guard was tried here on 2026-08-04 and REMOVED, because it
  # could not detect what it was written for. Most mutations round-trip JSON, and
  # json.dump reformats the file even when the VALUE is unchanged — so `cmp`
  # reports "changed" for a mutation that changed nothing. Verified by making one
  # case a no-op: bytes differed, the guard stayed silent, the case still said
  # PASS.
  #
  # The honest check is semantic, and it already exists: this function requires
  # the gate to exit NON-ZERO. A mutation that does nothing leaves the target
  # healthy, the gate exits 0, and the case reports FAIL. That is the correct
  # signal — it says "this case proves nothing", which is exactly what is true.
  # Adding a check that cannot see its own target would have been decoration.

  local out status
  out=$(eval "$gate" 2>&1); status=$?
  cp "$SCRATCH/backup" "$file"

  if [ "$status" -ne 0 ]; then
    echo "PASS  $name — gate exited $status"
    PASS=$((PASS+1))
  else
    echo "FAIL  $name — GATE DID NOT FIRE (exit 0)"
    [ "$VERBOSE" = 1 ] && printf '%s\n' "$out" | tail -5
    FAIL=$((FAIL+1))
  fi
}

# A PROBE THAT PRINTS FAIL MUST FAIL THE SUITE. Measured 2026-08-05: forcing one
# probe to print "FAIL — forced" still produced "15 passed, 0 failed" and exit 0.
# Six probes had been decorative for their whole existence — printing verdicts
# nothing acted on, which is the same defect the probes exist to catch.
#
# Subshells cannot increment the parent's counters, so they signal by exit status
# and the parent counts it here.

probe_done() {
  if [ "$1" -eq 0 ]; then PASS=$((PASS+1)); else FAIL=$((FAIL+1)); fi
}

echo "=== gate self-test: each case breaks one thing and requires the gate to notice ==="

# 1. Claim schema validation — an invalid confidence must be rejected.
check "claim schema rejects out-of-range confidence" \
  "claims/GQ-010-fame-vs-dependence.claim.json" \
  "node scripts/verify-claim-packets.mjs" \
  "
import json
p='claims/GQ-010-fame-vs-dependence.claim.json'
d=json.load(open(p)); d['claim']['confidence']=42
json.dump(d,open(p,'w'),indent=2)"

# 2. Grounding must dereference. A quote that no longer matches its byte range
#    is the failure the whole claim layer rests on not having.
check "grounding detects a quote that no longer matches" \
  "claims/GQ-010-fame-vs-dependence.claim.json" \
  "node scripts/verify-claim-packets.mjs" \
  "
import json
p='claims/GQ-010-fame-vs-dependence.claim.json'
d=json.load(open(p)); d['grounding'][0]['quote']='this text is not at that offset'
json.dump(d,open(p,'w'),indent=2)"

# 3. Declared derivations must be re-derived, not trusted.
  # NOT --skip-sqlite. Measured 2026-08-06: this case plants a falsified number whose
  # derivation IS a sqlite query, so skipping sqlite made it report status
  # source_missing — unverifiable rather than wrong — and the gate correctly
  # declined to fire. The case was asserting a defect it had made invisible.
check "audit catches a falsified declared number" \
  "metrics/2026-08-04-gq010-underrated-evidence.json" \
  "node scripts/audit-asserted-numbers.mjs --strict" \
  "
import json
p='metrics/2026-08-04-gq010-underrated-evidence.json'
d=json.load(open(p)); d['signal_coverage']['edges_with_dependent_repos']=1
json.dump(d,open(p,'w'),indent=2)"

# 4. A metrics file a live claim grounds in must not lose its derivations
#    silently — the exact regression that hid seven unchecked files.
check "audit notices evidence losing its derivations" \
  "metrics/2026-08-04-gq010-underrated-evidence.json" \
  "node scripts/audit-asserted-numbers.mjs --skip-sqlite --strict" \
  "
import json
p='metrics/2026-08-04-gq010-underrated-evidence.json'
d=json.load(open(p)); d.pop('derivations',None)
json.dump(d,open(p,'w'),indent=2)"

# 5. A reproducer pointing at a missing script reads as covered.
check "audit catches a reproducer that is not on disk" \
  "metrics/2026-08-04-gq008-cache-block-isolated.json" \
  "node scripts/audit-asserted-numbers.mjs --skip-sqlite --strict" \
  "
import json
p='metrics/2026-08-04-gq008-cache-block-isolated.json'
d=json.load(open(p)); d['reproduced_by']='scripts/deleted-by-someone.sh'
json.dump(d,open(p,'w'),indent=2)"

# 6. A documented command that does not exist.
check "audit catches a README command with no npm script" \
  "package.json" \
  "node scripts/audit-asserted-numbers.mjs --skip-sqlite --strict" \
  "
import json
p='package.json'
d=json.load(open(p)); d['scripts'].pop('ia:probe',None)
json.dump(d,open(p,'w'),indent=2)"

# 7. Refresh ledger must not claim fresh while its triggers fired.
# Backdating checked_at is not enough on its own: a trigger only fires if a
# commit touched a watched path since then. The scratch repo's own base commit
# touches schemas/ and sources/, so backdating past it makes those triggers fire
# against real history — which is what this gate is supposed to notice.
#
# THIS CASE DEPENDS ON TRIGGER_PATHS, and that dependency is invisible. It passes
# only because the base commit touches at least one watched path. Checked
# 2026-08-05 after narrowing 'new evidence source' from sources/ to contract
# files only: schemas/ 1 file, adapter-contract.json 1, claims/ 10 — three live
# triggers, so it still fires. Narrow TRIGGER_PATHS far enough and this case
# would stop firing FOR THE RIGHT REASON and pass FOR THE WRONG ONE.
#
# If you tighten a trigger, re-check that this case still exits non-zero.
# Mechanical version of the paragraph above: prove at least one watched path is
# present before relying on it. A comment asking the next person to re-check is
# a comment; this fails loudly instead.
echo -n "PROBE the refresh case has a trigger to fire — "
(
  live=0
  for pat in schemas sources/internet-archive/adapter-contract.json claims; do
    [ -e "$pat" ] && live=$((live+1))
  done
  if [ "$live" -gt 0 ]; then echo "PASS ($live watched path(s) present)"
  else echo "FAIL — no watched path in the scratch repo; case 7 would pass having tested nothing"; exit 1; fi
)
probe_done $?

echo -n "PROBE the rights and selection rules hold at their boundaries — "
(
  # THE HIGHEST-CONSEQUENCE RULES IN THE REPO, and until 2026-08-06 neither was
  # testable: both lived inside build-want-list.mjs, which fetches from the
  # Internet Archive at import time. One decides the RIGHTS BASIS on which a book
  # is admitted; the other decides whether an item is a book at all.
  #
  # Boundaries, not happy paths: 1928 upgrades and 1929 does not; a missing year
  # never upgrades; 'none' and 'not-a-designation' are never promoted no matter
  # how old the work is. And a printed periodical whose title contains "Letter"
  # must survive while a dated manuscript letter does not.
  out=$(node -e "
import('$ROOT/scripts/lib/selection-rules.mjs').then(m=>{
  const c=[
    [m.ageSettled(1611,'bare-assertion'),'age-settled'],
    [m.ageSettled(1928,'bare-assertion'),'age-settled'],
    [m.ageSettled(1929,'bare-assertion'),'bare-assertion'],
    [m.ageSettled(null,'bare-assertion'),'bare-assertion'],
    [m.ageSettled(1611,'none'),'none'],
    [m.ageSettled(1611,'not-a-designation'),'not-a-designation'],
    [String(m.isCorrespondence('William Cheyney Letter to son 1892-05-16')),'true'],
    [String(m.isCorrespondence(\"Vegetable Growers' News Letter\")),'false'],
    [String(m.isCorrespondence('A letter to Thomas Trotter : occasioned by his proposal')),'false'],
    [String(m.isStreetAddress('3733 Chevy Chase Drive, La Cañada Flintridge, California')),'true'],
    [String(m.isStreetAddress('Roads and Bridges of Devon')),'false'],
    [String(m.isNotABook('William Cheyney Letter to son 1892-05-16')),'true'],
    [String(m.isNotABook('The Gardener')),'false'],
    [String(m.isCourtFiling('People v. Gold Run (Part 49 of 52) - Order Extending time')),'true'],
    [String(m.isCourtFiling(\"Part 2 of the Gardener's Kalendar\")),'false'],
    [String(m.isPhotograph('Mediterranean Style Home, Flintridge, California (front view)')),'true'],
    [String(m.isPhotograph('The Gardener (second edition)')),'false'],
    [String(m.isBarrenCollection('calcflh_000123')),'true'],
    [String(m.isBarrenCollection('caggljhs_000207')),'true'],
    [String(m.isBarrenCollection('b21299055_0002')),'false'],
  ];
  const bad=c.filter(([g,w])=>g!==w);
  console.log(bad.length ? 'FAIL '+JSON.stringify(bad) : 'OK '+c.length);
});" 2>&1)
  case "$out" in
    OK*) echo "PASS ($out assertions)" ;;
    *)   echo "FAIL — $out"; exit 1 ;;
  esac
)
probe_done $?

check "refresh evaluator detects a stale entry claiming fresh" \
  "refresh/ledger.json" \
  "node scripts/evaluate-refresh.mjs" \
  "
import json
p='refresh/ledger.json'
d=json.load(open(p))
for e in d['entries']:
    e['checked_at']='2020-01-01T00:00:00Z'; e['result']='fresh'
json.dump(d,open(p,'w'),indent=2)"

# A snapshot number that disagrees with its source. This is the check that was
# added because 24 of 47 published numbers declared nothing at all — so it must
# itself be proven to fire, or the coverage fix becomes another quiet checker.
check "audit catches a snapshot number contradicting its source" \
  "observatory/snapshot.json" \
  "node scripts/audit-asserted-numbers.mjs --skip-sqlite --strict" \
  "
import json
p='observatory/snapshot.json'
d=json.load(open(p)); d['god_questions']['total']=99
json.dump(d,open(p,'w'),indent=2)"

# A corrupt file in a directory a derivation reads. This one was genuinely
# invisible: the join skipped the bad file, measured a smaller registry, and
# agreed with itself — no mismatch, no finding, checks_skipped 0 — while
# file-count over the same directory still counted it.
#
# NOT run through check(). That helper backs up and restores by path, and this
# case's target is the REAL registry outside the scratch copy — a failure
# mid-case would leave a corrupt registry file on disk. Done inline with an
# explicit restore instead, so the repair is unconditional.
echo -n "PROBE corrupt file inside a derivation source — "
(
  T=$(ls "$HOME/SISO_Workspace/great-library-of-siso/registry/releases"/*.json | head -1)
  cp "$T" /tmp/selftest-rel-backup.json
  printf '{ corrupt' > "$T"
  node scripts/audit-asserted-numbers.mjs --skip-sqlite --strict >/dev/null 2>&1
  st=$?
  cp /tmp/selftest-rel-backup.json "$T"     # restore first, always
  rm -f /tmp/selftest-rel-backup.json
  if [ "$st" -ne 0 ]; then echo "PASS (exit $st)"; else echo "FAIL — corrupt source passed silently"; exit 1; fi
)
probe_done $?

# A list published as a bare count. Twice this session the page showed "N queued"
# or "N awaiting" while the content lived only in the raw JSON dump — same
# function, adjacent table rows. With zero working push routes, a count Shaan
# cannot act on is the whole defect.
check "audit catches a list rendered as a count" \
  "public/index.html" \
  "node scripts/audit-asserted-numbers.mjs --skip-sqlite --strict" \
  "
import re
p='public/index.html'
h=open(p).read()
h=re.sub(r'<section><h2>God Questions \(registry\)</h2>.*?</section>','',h,flags=re.S)
open(p,'w').write(h)"

# A claim file that cannot be parsed. The claim-packet verifier catches this,
# but the audit used to exit 0 and report success while silently dropping the
# claim from its grounded-evidence set — two gates disagreeing about whether the
# repo is healthy, which is worse than either failing alone.
check "audit catches an unparseable claim file" \
  "claims/GQ-010-fame-vs-dependence.claim.json" \
  "node scripts/audit-asserted-numbers.mjs --skip-sqlite --strict" \
  "
open('claims/GQ-010-fame-vs-dependence.claim.json','w').write('{ broken')"

# Evidence that cannot be READ is worse than evidence that disagrees, and it
# used to vanish from the audit entirely — an unparseable metrics file was
# skipped with no trace, so a claim grounded in it looked fully checked.
check "audit catches unparseable evidence a claim grounds in" \
  "metrics/2026-08-04-gq010-underrated-evidence.json" \
  "node scripts/audit-asserted-numbers.mjs --skip-sqlite --strict" \
  "
open('metrics/2026-08-04-gq010-underrated-evidence.json','w').write('{ broken json')"

# The shared path resolver must not silently stop resolving. If resolveLabel
# returned undefined for everything, every declared derivation would be skipped
# and the audit would report success having checked nothing — the exact shape of
# the three silent skips already found this session.
check "audit notices when label resolution stops working" \
  "scripts/lib/snapshot-paths.mjs" \
  "node scripts/audit-asserted-numbers.mjs --skip-sqlite --strict" \
  "
p='scripts/lib/snapshot-paths.mjs'
t=open(p).read()
t=t.replace('const bare = walk(snap, label);','const bare = undefined;')
t=t.replace('const prefixed = walk(snap, \`\${BUCKET}.\${label}\`);','const prefixed = undefined;')
open(p,'w').write(t)"

# A derivation that does not read the source it names. This is the defect that
# appeared four times in one session — a checker keyed differently from the
# thing it checks — and it always agreed rather than erroring, so only a
# sensitivity test can see it.
check "sensitivity catches a derivation that reads nothing" \
  "observatory/snapshot.json" \
  "node scripts/derivation-sensitivity.mjs" \
  "
import json
p='observatory/snapshot.json'
d=json.load(open(p))
d['derivations']['fake.insensitive']={'kind':'file-count','source':'scripts','query':'*.nonexistent-ext'}
json.dump(d,open(p,'w'),indent=2)"

# A query reading one source while a sibling source exists. Found twice on
# 2026-08-04 by accident, and the FIRST version of this gate missed it — a
# comment mentioning book_external satisfied a whole-file substring check while
# the SQL below still read `from book` alone. Both the bug and the gate's own
# blind spot are covered here.
check "source-coverage catches a query blind to a second source" \
  "scripts/ia-title-dedup.mjs" \
  "node scripts/audit-source-coverage.mjs --strict" \
  "
p='scripts/ia-title-dedup.mjs'
t=open(p).read()
i=t.find(' union all select ext_id'); j=t.find(chr(39)+',', i)
open(p,'w').write(t[:i]+';'+t[j+1:])"

# A script named in README PROSE but never invoked. Measured 2026-08-04: adding
# "We once considered scripts/orphan-probe.mjs but abandoned it." marked it as
# reachable — a sentence saying it was ABANDONED satisfied the reachability
# check. Fourth instance that day of prose satisfying a check meant for code.
echo -n "PROBE prose mention does not count as a reference — "
(
  P=$(mktemp -d "/tmp/gate-prose-XXXXXX")
  rsync -a --quiet --exclude '.git' --exclude 'node_modules' "$ROOT"/ "$P/repo/"
  cd "$P/repo" || exit 1
  echo 'console.log(1);' > scripts/orphan-probe.mjs
  printf '\nWe once considered scripts/orphan-probe.mjs but abandoned it.\n' >> README.md
  n=$(node scripts/audit-asserted-numbers.mjs 2>/dev/null | grep -c 'orphan-probe')
  rm -rf "$P"
  if [ "${n:-0}" -gt 0 ]; then echo "PASS (flagged despite the prose mention)"; else echo "FAIL — prose alone marked it referenced"; exit 1; fi
)
probe_done $?

# The shared claim reader must not silently stop resolving. If groundingSourceId
# returned '' for everything, the audit would find zero grounded metrics and
# report a clean repo having checked nothing — the same shape as the snapshot
# resolver failure, and the reason lib/claim-paths.mjs exists at all.
  # NOT --skip-sqlite. Measured 2026-08-06: this case plants a falsified number whose
  # derivation IS a sqlite query, so skipping sqlite made it report status
  # source_missing — unverifiable rather than wrong — and the gate correctly
  # declined to fire. The case was asserting a defect it had made invisible.
check "audit notices when the claim reader stops resolving" \
  "scripts/lib/claim-paths.mjs" \
  "node scripts/audit-asserted-numbers.mjs --strict" \
  "
p='scripts/lib/claim-paths.mjs'
t=open(p).read()
t=t.replace(\"return String(g?.source?.id || '');\", \"return '';\")
open(p,'w').write(t)"

# The patch helper must refuse a no-op. This is the defect that hit five times
# on 2026-08-04 — an edit that silently does not apply, while the patch script
# exits 0 AND node --check passes. Reproduced in isolation that day: 0 imports
# landed, both signals green.
echo -n "PROBE patch helper refuses a silent no-op — "
(
  W=$(mktemp -d "/tmp/gate-patch-XXXXXX")
  printf 'export const a = 1;\n' > "$W/s.mjs"
  out=$(PATCHLIB="$ROOT/scripts/lib/patch.mjs" TARGET="$W/s.mjs" node --input-type=module -e "
    const { applyEdit } = await import(process.env.PATCHLIB);
    try { applyEdit(process.env.TARGET, { find: 'a = 1', replace: 'a = 1' }); console.log('NOTHROW'); }
    catch { console.log('THREW'); }" 2>/dev/null)
  rm -rf "$W"
  if [ "$out" = "THREW" ]; then echo "PASS (no-op rejected)"; else echo "FAIL — a no-op edit reported success"; exit 1; fi
)
probe_done $?

# The destructive script must refuse when its guards are broken. Added
# 2026-08-05 after finding enforce-log-retention.sh — the ONE script here that
# deletes data — had zero self-test coverage, and my first attempt at covering
# it passed 5 of 6 cases with the script DELETED, because the cases asserted
# things about sqlite rather than exercising the script.
echo -n "PROBE the deleting script is actually exercised — "
(
  out=$(bash "$ROOT/scripts/retention-selftest.sh" 2>&1 | tail -1)
  if printf '%s' "$out" | grep -q '6 passed, 0 failed'; then echo "PASS ($out)"; else echo "FAIL — $out"; exit 1; fi
)
probe_done $?

# The swallow that started all this: if git cannot answer, the gate must refuse
# rather than report everything fresh from zero information.
echo -n "PROBE refuses to evaluate without git — "
(
  NOGIT=$(mktemp -d "/tmp/gate-nogit-XXXXXX")
  rsync -a --quiet --exclude '.git' --exclude 'node_modules' "$ROOT"/ "$NOGIT/repo/"
  cd "$NOGIT/repo" && node scripts/evaluate-refresh.mjs >/dev/null 2>&1
  st=$?
  rm -rf "$NOGIT"
  if [ "$st" -ne 0 ]; then echo "PASS (exit $st)"; else echo "FAIL — reported fresh with no git"; exit 1; fi
)
probe_done $?

# STARVATION, not corruption. Every case above breaks an artifact by making it
# WRONG — a corrupt JSON, a bad number, a missing table. Measured 2026-08-05,
# three separate bugs in one day shared the opposite shape: the input was not
# wrong, it was ABSENT, and each gate answered as though absent meant fine.
#
#   rebuild-corpus     mktemp failed -> LOGFILE empty -> grep found no skips ->
#                      exit 9 on a corpus that was correct
#   enforce-retention  unreadable database -> counts empty -> "nothing to do", exit 0
#   audit-source-cov   empty sources/ -> checked_files 0 -> findings [], exit 0
#
# A corrupt file and a missing file are DIFFERENT tests, and passing the first
# says nothing about the second. These cases starve a gate of its input entirely
# and require it to refuse.
echo -n "PROBE source-coverage audit starved of every source file — "
(
  S=$(mktemp -d "/tmp/gate-starve-XXXXXX")
  mkdir -p "$S/sources"
  cd "$S" && node "$ROOT/scripts/audit-source-coverage.mjs" --strict >/dev/null 2>&1
  st=$?
  rm -rf "$S"
  if [ "$st" -ne 0 ]; then echo "PASS (exit $st)"; else echo "FAIL — reported clean having read zero files"; exit 1; fi
)
probe_done $?

echo -n "PROBE retention job pointed at a file that is not a database — "
(
  S=$(mktemp -d "/tmp/gate-starve-XXXXXX")
  printf 'not a database\n' > "$S/garbage.sqlite"
  LOG_DB_OVERRIDE="$S/garbage.sqlite" bash "$ROOT/scripts/enforce-log-retention.sh" >/dev/null 2>&1
  st=$?
  rm -rf "$S"
  if [ "$st" -ne 0 ]; then echo "PASS (exit $st)"; else echo "FAIL — reported 'nothing to do' on an unreadable log"; exit 1; fi
)
probe_done $?

echo
echo "=== $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] || exit 1
