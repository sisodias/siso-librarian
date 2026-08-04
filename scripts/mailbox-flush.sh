#!/usr/bin/env bash
# Deliver queued escalations to the laptop mailbox when the link is up.
#
# The laptop has flapped four times in one session — offline ~9h, back for ~10
# minutes, offline again. Polling it by hand means the queue drains only when
# someone remembers to look. This drains it whenever it can, and is a no-op
# when the link is down.
#
# Messages are files in outbox/. A delivered message is moved to outbox/sent/
# rather than deleted, so the repo keeps the record of what was sent and when.
#
#   mailbox-flush.sh          attempt delivery of everything queued
#   mailbox-flush.sh status   show what is queued and whether the link is up
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/outbox"
SENT="$OUT/sent"
PEER=shaansisodia@100.118.29.68
REMOTE='~/SISO_Workspace/.agents/mailbox/to-main'

link_up() {
  ssh -o ConnectTimeout=8 -o BatchMode=yes -o StrictHostKeyChecking=no \
    "$PEER" 'echo up' 2>/dev/null | grep -q up
}

mkdir -p "$OUT" "$SENT"

queued=$(find "$OUT" -maxdepth 1 -name '*.md' 2>/dev/null | sort)
n=$(printf '%s' "$queued" | grep -c . || true)

if [ "${1:-flush}" = "status" ]; then
  echo "queued: $n"
  [ -n "$queued" ] && printf '%s\n' "$queued" | sed "s|$ROOT/||"
  if link_up; then echo "link: up"; else echo "link: down"; fi
  exit 0
fi

if [ "$n" -eq 0 ]; then echo "nothing queued"; exit 0; fi

if ! link_up; then
  echo "link down — $n message(s) stay queued (this is not an error)"
  exit 0
fi

sent=0
while IFS= read -r f; do
  [ -n "$f" ] || continue
  base=$(basename "$f")
  # Verify delivery by listing the remote file, never by trusting scp's exit code.
  if ssh -o ConnectTimeout=12 -o BatchMode=yes -o StrictHostKeyChecking=no \
       "$PEER" "mkdir -p $REMOTE && cat > $REMOTE/$base" < "$f" 2>/dev/null \
     && ssh -o ConnectTimeout=12 -o BatchMode=yes -o StrictHostKeyChecking=no \
       "$PEER" "test -s $REMOTE/$base" 2>/dev/null; then
    mv "$f" "$SENT/$base"
    echo "delivered: $base"
    sent=$((sent+1))
  else
    echo "FAILED (stays queued): $base"
  fi
done <<< "$queued"

echo "delivered $sent of $n"
