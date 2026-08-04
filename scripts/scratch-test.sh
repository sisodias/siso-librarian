#!/usr/bin/env bash
# Run a command against a throwaway clone of this repo, never the live one.
#
# Twice on 2026-08-04 a test damaged the thing it was testing:
#   - cloned before committing, so it silently tested the PUSHED version
#     while the fix under test sat uncommitted in the working tree
#   - ran `git reset --hard HEAD~1` to undo a probe commit, which discarded
#     an uncommitted fix along with it
#
# Both share a cause: using git operations as test scaffolding in the live
# repo. This makes the safe path the short one.
#
#   scratch-test.sh 'npm run verify'
#   scratch-test.sh 'node scripts/evaluate-refresh.mjs | head'
#   scratch-test.sh --dirty 'npm run verify'   # include uncommitted changes
#
# By default the clone is of committed HEAD, and the script REFUSES to run if
# the working tree is dirty — because a clone of HEAD would not contain your
# edit, which is exactly the failure this exists to prevent. --dirty copies the
# working tree instead, for testing changes before committing them.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODE=head
if [ "${1:-}" = "--dirty" ]; then MODE=dirty; shift; fi
CMD="${1:-}"
[ -n "$CMD" ] || { echo "usage: scratch-test.sh [--dirty] '<command>'" >&2; exit 64; }

DIRTY=$(cd "$ROOT" && git status --porcelain -- . ':!.claude' ':!.tick.log' | head -20)

if [ "$MODE" = head ] && [ -n "$DIRTY" ]; then
  echo "REFUSING: working tree has uncommitted changes, so a clone of HEAD" >&2
  echo "would test the wrong version — the exact trap this script exists for." >&2
  echo "" >&2
  printf '%s\n' "$DIRTY" >&2
  echo "" >&2
  echo "Either commit first, or re-run with --dirty to test the working tree." >&2
  exit 65
fi

SCRATCH=$(mktemp -d "/tmp/scratch-test-XXXXXX")
cleanup() { rm -rf "$SCRATCH"; }
trap cleanup EXIT

if [ "$MODE" = dirty ]; then
  # copy the working tree, excluding the vault-sized and generated noise
  rsync -a --quiet --exclude '.git' --exclude 'node_modules' "$ROOT"/ "$SCRATCH"/repo/
  (cd "$SCRATCH/repo" && git init -q . && git add -A >/dev/null 2>&1 \
     && git -c user.email=s@s -c user.name=s commit -q -m "scratch working tree" >/dev/null 2>&1) || true
else
  git clone -q "$ROOT" "$SCRATCH/repo" || { echo "clone failed" >&2; exit 1; }
fi

echo "scratch: $SCRATCH/repo  (mode=$MODE)"
( cd "$SCRATCH/repo" && eval "$CMD" )
STATUS=$?
echo "--- exit=$STATUS, scratch discarded ---"
exit $STATUS
