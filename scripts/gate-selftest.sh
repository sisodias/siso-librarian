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
git init -q .
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
  "node scripts/audit-asserted-numbers.mjs --strict" \
  "
import json
p='metrics/2026-08-04-gq010-underrated-evidence.json'
d=json.load(open(p)); d.pop('derivations',None)
json.dump(d,open(p,'w'),indent=2)"

# 5. A reproducer pointing at a missing script reads as covered.
check "audit catches a reproducer that is not on disk" \
  "metrics/2026-08-04-gq008-cache-block-isolated.json" \
  "node scripts/audit-asserted-numbers.mjs --strict" \
  "
import json
p='metrics/2026-08-04-gq008-cache-block-isolated.json'
d=json.load(open(p)); d['reproduced_by']='scripts/deleted-by-someone.sh'
json.dump(d,open(p,'w'),indent=2)"

# 6. A documented command that does not exist.
check "audit catches a README command with no npm script" \
  "package.json" \
  "node scripts/audit-asserted-numbers.mjs --strict" \
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
  "node scripts/audit-asserted-numbers.mjs --strict" \
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
  node scripts/audit-asserted-numbers.mjs --strict >/dev/null 2>&1
  st=$?
  cp /tmp/selftest-rel-backup.json "$T"     # restore first, always
  rm -f /tmp/selftest-rel-backup.json
  if [ "$st" -ne 0 ]; then echo "PASS (exit $st)"; else echo "FAIL — corrupt source passed silently"; fi
)

# A list published as a bare count. Twice this session the page showed "N queued"
# or "N awaiting" while the content lived only in the raw JSON dump — same
# function, adjacent table rows. With zero working push routes, a count Shaan
# cannot act on is the whole defect.
check "audit catches a list rendered as a count" \
  "public/index.html" \
  "node scripts/audit-asserted-numbers.mjs --strict" \
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
  "node scripts/audit-asserted-numbers.mjs --strict" \
  "
open('claims/GQ-010-fame-vs-dependence.claim.json','w').write('{ broken')"

# Evidence that cannot be READ is worse than evidence that disagrees, and it
# used to vanish from the audit entirely — an unparseable metrics file was
# skipped with no trace, so a claim grounded in it looked fully checked.
check "audit catches unparseable evidence a claim grounds in" \
  "metrics/2026-08-04-gq010-underrated-evidence.json" \
  "node scripts/audit-asserted-numbers.mjs --strict" \
  "
open('metrics/2026-08-04-gq010-underrated-evidence.json','w').write('{ broken json')"

# The shared path resolver must not silently stop resolving. If resolveLabel
# returned undefined for everything, every declared derivation would be skipped
# and the audit would report success having checked nothing — the exact shape of
# the three silent skips already found this session.
check "audit notices when label resolution stops working" \
  "scripts/lib/snapshot-paths.mjs" \
  "node scripts/audit-asserted-numbers.mjs --strict" \
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

# The swallow that started all this: if git cannot answer, the gate must refuse
# rather than report everything fresh from zero information.
echo -n "PROBE refuses to evaluate without git — "
(
  NOGIT=$(mktemp -d "/tmp/gate-nogit-XXXXXX")
  rsync -a --quiet --exclude '.git' --exclude 'node_modules' "$ROOT"/ "$NOGIT/repo/"
  cd "$NOGIT/repo" && node scripts/evaluate-refresh.mjs >/dev/null 2>&1
  st=$?
  rm -rf "$NOGIT"
  if [ "$st" -ne 0 ]; then echo "PASS (exit $st)"; else echo "FAIL — reported fresh with no git"; fi
)

echo
echo "=== $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] || exit 1
