#!/usr/bin/env bash
# Run every suite and report the blast radius of the last change.
#
# WHY. Five suites exist and nothing ran them together. Each time I added a gate
# I ran whichever suite I happened to think of, which is exactly how two
# blast-radius failures reached the next turn before being noticed:
#
#   2026-08-05  a new `hooks-not-wired` check made gates-are-load-bearing.sh
#               report BASELINE FAILED — correct behaviour, wrong context
#   2026-08-05  a `cmp -s` guard in gate-selftest.sh could not detect its own
#               target, and I only found out by testing it on purpose
#
# A gate is not finished when it passes its own test. It is finished when
# nothing ELSE broke.
#
# Each suite is run to completion — no short-circuit. A chain that stops at the
# first failure hides how many things one change broke, which is the number this
# script exists to report.
#
#   check-all.sh          run everything, report per-suite status
#   check-all.sh --quick  skip the slow suites — for the pre-push hook
#
# MEASURED 2026-08-05, which is why --quick exists:
#   verify              97s
#   gate self-test      56s   (was 437s; --skip-sqlite in the 11 audit cases)
#   retention          <1s
#   load-bearing       ~300s  (runs the chain once per gate)
# The full run took 8m24s as a pre-push hook. A gate that makes pushing painful
# is a gate that gets bypassed, so --quick keeps verify + retention (~97s) on
# every push and leaves the two chain-replaying suites to `npm run check:all`.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1
QUICK=0
[ "${1:-}" = "--quick" ] && QUICK=1

PASS=0; FAIL=0
FAILED_SUITES=""

run() {
  local name="$1" cmd="$2" slow="${3:-0}"
  if [ "$QUICK" = "1" ] && [ "$slow" = "1" ]; then
    printf "  %-22s SKIP (slow)\n" "$name"
    return
  fi
  # TIME EVERY SUITE. Measured 2026-08-06: the pre-push hook crossed TEN MINUTES
  # and started timing out my own pushes, and I could not say which suite had
  # grown — this script reported pass/fail and no duration, so the only way to
  # find out was to re-run each by hand.
  #
  # A gate too slow to run is a gate that gets skipped, and that is how the
  # `--quick` skip list grew in the first place. Cost is a number worth watching
  # BEFORE it forces that choice, not after.
  local out status start elapsed
  start=$(date +%s)
  out=$(eval "$cmd" 2>&1); status=$?
  elapsed=$(( $(date +%s) - start ))
  if [ "$status" -eq 0 ]; then
    # Report the count the suite itself printed. `verify` prints none, and an
    # empty column there is honest — inventing "PASS (0 checks)" would read as
    # coverage that was never claimed.
    printf "  %-22s PASS  %-22s %4ss\n" "$name" "$(printf '%s' "$out" | grep -oE '[0-9]+ (passed|load-bearing)[^,]*' | tail -1)" "$elapsed"
    PASS=$((PASS+1))
  else
    printf "  %-22s FAIL (exit %s) %4ss\n" "$name" "$status" "$elapsed"
    printf '%s\n' "$out" | tail -4 | sed 's/^/      /'
    FAIL=$((FAIL+1))
    FAILED_SUITES="$FAILED_SUITES $name"
  fi
}

echo "=== every suite, run to completion ==="
run "verify chain"        "npm run verify"
run "gate self-test"      "bash scripts/gate-selftest.sh"
run "retention self-test" "bash scripts/retention-selftest.sh"
run "rebuild self-test"   "bash scripts/rebuild-selftest.sh"
# No longer marked slow. Measured 2026-08-05: 402s -> 303s after reordering the
# verify chain so cheap gates run first, and verify itself went 418s -> 63s
# once the corpus aggregates were stored. It fits on the hook now.
run "gates load-bearing"  "bash scripts/gates-are-load-bearing.sh"

echo
if [ "$FAIL" -eq 0 ]; then
  echo "=== $PASS suites pass, 0 fail ==="
else
  echo "=== $PASS pass, $FAIL FAIL:$FAILED_SUITES ==="
  echo "A change that breaks a suite it was not aimed at is the blast radius. Read the"
  echo "failure before assuming the suite is wrong — twice on 2026-08-05 the suite was"
  echo "right and my new check was firing in a context it should not have."
fi
[ "$FAIL" -eq 0 ] || exit 1
