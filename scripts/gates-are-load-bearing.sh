#!/usr/bin/env bash
# Prove every gate is load-bearing: remove it, and `npm run verify` must fail.
#
# WHY THIS EXISTS. gate-selftest.sh proves each gate FIRES on a broken artifact.
# It does not prove the chain would notice if a gate simply vanished. Those are
# different questions, and the second one caught a real defect on 2026-08-05:
# my retention self-test passed 5 of 6 cases with the script it tested DELETED,
# because the cases exercised sqlite rather than the script.
#
# I found that by accident, on one script. This asks it of all of them.
#
# THE TEST. For each gate in the verify chain: remove it from a scratch copy,
# run the chain, and require a non-zero exit.
#
# WHAT THIS PROVES, AND WHAT IT DOES NOT. Measured 2026-08-05 by adding a gate
# that prints a line and checks nothing: it reported PASS, because removing any
# named file makes the chain fail whether or not the file did any work.
#
#   proves    every gate in the chain is INVOKED and its exit code is honoured
#   does NOT  prove a gate checks anything meaningful
#
# gate-selftest.sh covers the second question by breaking artifacts on purpose.
# This covers the first, which nothing did — and the first is how a gate silently
# leaves the chain: a typo in package.json, an `|| true`, a rename.
#
# The `|| true` case is worth naming: appending it to a chain entry made ALL SIX
# real gates report FAIL, because it swallows the exit code of everything
# downstream. That is a live way to disable every gate at once with two words.
#
# Runs on an rsync copy. Nothing here touches the real repo.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
W=$(mktemp -d "/tmp/loadbearing-XXXXXX")
cleanup() { rm -rf "$W"; }
trap cleanup EXIT

rsync -a --quiet --exclude '.git' --exclude 'node_modules' "$ROOT"/ "$W/repo/"
cd "$W/repo" || exit 1

# Real git history: the refresh evaluator derives staleness from commits and
# refuses without them, so a copy with no .git fails for the wrong reason.
git init -q .
# Wire hooks in the copy. audit-verify-chain.mjs reports `hooks-not-wired` when
# core.hooksPath is unset — correct on a fresh clone, and it made the baseline
# fail here for a reason that has nothing to do with removing a gate. Measured
# 2026-08-05.
git config core.hooksPath .githooks
git -c user.email=s@s -c user.name=s add -A >/dev/null 2>&1
git -c user.email=s@s -c user.name=s commit -q -m base >/dev/null 2>&1
: > .lb-marker
git -c user.email=s@s -c user.name=s add -A >/dev/null 2>&1
git -c user.email=s@s -c user.name=s commit -q -m head >/dev/null 2>&1

GATES=$(/usr/bin/python3 -c "
import json
v=json.load(open('package.json'))['scripts']['verify']
print('\n'.join(s.strip().split()[1] for s in v.split('&&') if s.strip().startswith('node scripts/')))")

PASS=0; FAIL=0
echo "=== load-bearing test: removing a gate must break verify ==="

# The refresh evaluator reads GIT HISTORY, not repo files, and a scratch copy has
# exactly one synthetic commit that touches every watched path at once — so all
# 10 ledger triggers fire and verify fails for a reason that has nothing to do
# with the gate being removed. Measured 2026-08-05. Test the chain WITHOUT it;
# that gate has its own self-test case and its own git probe.
# Drop audit-verify-chain.mjs too, and this one is subtle. It runs FIRST and
# reports `chain-names-missing-gate` for any gate named in package.json but not
# on disk — so once it joined the chain, EVERY removal was caught by the guard
# rather than by the removed gate's own absence. Measured 2026-08-05: removals
# failed in 0s instead of 61s, and the suite reported "7 load-bearing" while
# testing one thing seven times.
#
# That is the wrong-reason-pass defect, in the test written to find it. The
# chain under test excludes the guard; the guard has its own probes.
CHAIN=$(/usr/bin/python3 -c "
import json
v=json.load(open('package.json'))['scripts']['verify']
keep=[s.strip() for s in v.split('&&')
      if 'evaluate-refresh' not in s and 'audit-verify-chain' not in s]
print(' && '.join(keep))")
runchain() { bash -c "$CHAIN" >/dev/null 2>&1; }

# Baseline first. If the chain does not pass on an untouched copy, every result
# below is meaningless — a failure would be attributed to the removal.
if runchain; then
  echo "baseline: the chain passes on the untouched copy (refresh gate excluded — it reads git history)"
else
  echo "BASELINE FAILED — the chain does not pass on a clean copy; results would be meaningless" >&2
  exit 2
fi

for g in $GATES; do
  [ -f "$g" ] || { echo "SKIP  $g (not on disk)"; continue; }
  # Skip what the chain does not run. Testing the removal of a gate that was
  # excluded above measures nothing — the chain passes because it never invoked
  # it, and the result reads as "not load-bearing" when the truth is "not
  # tested". Measured 2026-08-05: this produced a FAIL on evaluate-refresh.mjs
  # that was entirely an artefact of my own exclusion.
  case "$CHAIN" in
    *"$g"*) ;;
    *)
       case "$g" in
         *audit-verify-chain*) why="runs first and catches ANY missing gate, masking every other result" ;;
         *evaluate-refresh*)   why="reads git history, which a scratch copy cannot reproduce" ;;
         *)                    why="not in this chain" ;;
       esac
       echo "SKIP  $(basename "$g") — excluded: $why"; continue ;;
  esac
  mv "$g" "$g.removed"
  # npm exits non-zero when a chained command is missing, which is the signal.
  if runchain; then
    echo "FAIL  $(basename "$g") — the chain still passed without it"
    FAIL=$((FAIL+1))
  else
    echo "PASS  $(basename "$g") — the chain failed without it"
    PASS=$((PASS+1))
  fi
  mv "$g.removed" "$g"
done

echo
echo "=== $PASS load-bearing, $FAIL not ==="
[ "$FAIL" -eq 0 ] || exit 1
