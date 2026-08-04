#!/usr/bin/env bash
# Re-runs the GQ-008 cache experiment: identical request body and credential to
# two upstreams, only the path differs.
#
# Written 2026-08-04 because the metrics file recording this result declared no
# derivations and could not get one — the finding came from ISSUING REQUESTS,
# not from querying a log, so no SQL could reproduce it. The audit flagged it as
# `metrics-underived` and the honest options were to leave it flagged forever or
# to make the experiment itself re-runnable. This is the second.
#
# It is NOT a derivation in the audit's sense and deliberately does not pretend
# to be one: a derivation re-reads a source that already holds the answer, while
# this produces a fresh observation that could contradict the stored one. That
# distinction is the whole point — inventing a derivation kind that quietly
# re-read the stored result would have made the gate green while checking
# nothing.
#
#   gq008-cache-experiment.sh          run and print a comparison
#   gq008-cache-experiment.sh --write  also write metrics/<date>-gq008-cache-rerun.json
#
# Read-only against both gateways. Sends two chat completions; costs a few
# thousand cached input tokens.
set -uo pipefail

PROXY="http://127.0.0.1:8789"
BIFROST="http://127.0.0.1:8080"

# The two gateways name the same model differently, and this bit me on the first
# run: Bifrost rejected the bare name with "provider is required in model field",
# which is an ERROR, not a cache miss. Had I recorded that arm as 0 cached tokens
# it would have looked exactly like the defect I was trying to reproduce, and I
# would have "confirmed" the finding without ever reaching the provider.
#
# The provider prefix is case-sensitive: `Minimax/MiniMax-M3` works,
# `minimax/MiniMax-M3` is rejected. Read from /api/providers, not guessed.
MODEL_PROXY="MiniMax-M3"
MODEL_BIFROST="Minimax/MiniMax-M3"

# The prompt must be long enough to exceed the provider's minimum cacheable
# length and IDENTICAL across both paths, or the comparison measures prompt
# length rather than gateway behaviour.
PROMPT=$(/usr/bin/python3 -c "print('The Great Library of SISO keeps standing questions, evidence, and claims. ' * 60)")

KEY=$(/usr/bin/python3 -c "
import re,os
p=os.path.expanduser('~/.config/go-llm-proxy/minimax-codex.yaml')
t=open(p).read()
m=re.search(r'keys:\s*\n\s*-\s*key:\s*[\"\']?([^\"\'\s]+)', t)
print(m.group(1) if m else '')" 2>/dev/null)

[ -n "$KEY" ] || { echo "could not read proxy gate key — cannot run experiment" >&2; exit 70; }

# Two calls per path: the first populates the cache, the second reads it. A
# single call would report 0 cached tokens on a working path and look identical
# to a broken one.
probe() {
  local base="$1" label="$2" model="$3"
  local body out1 out2
  body=$(/usr/bin/python3 -c "
import json,sys
print(json.dumps({
 'model': '$model',
 'max_tokens': 16,
 'messages': [
   {'role':'system','content':[{'type':'text','text':sys.stdin.read(),
     'cache_control':{'type':'ephemeral'}}]},
   {'role':'user','content':'Reply with the single word: ok'}]}))" <<< "$PROMPT")

  out1=$(/usr/bin/curl -sS --max-time 90 -X POST "$base/v1/chat/completions" \
    -H "Authorization: Bearer $KEY" -H 'Content-Type: application/json' \
    -d "$body" 2>/dev/null)
  out2=$(/usr/bin/curl -sS --max-time 90 -X POST "$base/v1/chat/completions" \
    -H "Authorization: Bearer $KEY" -H 'Content-Type: application/json' \
    -d "$body" 2>/dev/null)

  /usr/bin/python3 -c "
import json,sys
raw=sys.stdin.read()
try: d=json.loads(raw)
except Exception:
    print(json.dumps({'path':'$label','error':'unparseable response','raw':raw[:200]})); sys.exit()
u=d.get('usage') or {}
if 'error' in d:
    print(json.dumps({'path':'$label','error':str(d['error'])[:200]})); sys.exit()
det=u.get('prompt_tokens_details') or {}
cached=det.get('cached_tokens', u.get('cache_read_input_tokens', 0)) or 0
pt=u.get('prompt_tokens', 0)
print(json.dumps({'path':'$label','prompt_tokens':pt,'cached_tokens':cached,
                  'cache_works':bool(cached and cached>0)}))" <<< "$out2"
}

echo "GQ-008 cache experiment — two calls per path, second call reports cache reads"
A=$(probe "$PROXY" "go-llm-proxy 127.0.0.1:8789" "$MODEL_PROXY")
B=$(probe "$BIFROST" "Bifrost 127.0.0.1:8080" "$MODEL_BIFROST")
echo "$A"
echo "$B"

# An arm that errored is NOT a measurement of zero cached tokens. Refusing here
# rather than writing the result is the difference between reproducing a finding
# and manufacturing one — a rejected request and a stripped cache_control header
# both yield "no cached tokens" while meaning entirely different things.
if grep -q '"error"' <<< "$A$B"; then
  echo "REFUSING to record: at least one arm errored, which is not a cache result." >&2
  exit 75
fi

if [ "${1:-}" = "--write" ]; then
  STAMP=$(/bin/date -u +%Y-%m-%dT%H:%M:%SZ)
  DATE=$(/bin/date -u +%Y-%m-%d)
  OUT="metrics/${DATE}-gq008-cache-rerun.json"
  /usr/bin/python3 -c "
import json,sys
a,b=json.loads(sys.argv[1]),json.loads(sys.argv[2])
json.dump({
 'measured_at':'$STAMP','question':'GQ-008',
 'experiment':'identical request body and credential sent to two upstreams; only the path differs',
 'reproduced_by':'scripts/gq008-cache-experiment.sh',
 'note':('Fresh observation, not a re-derivation. This can contradict the stored result, which is '
         'why it is a script rather than a derivations block.'),
 'results':[a,b]}, open('$OUT','w'), indent=2)
open('$OUT','a').write('\n')
print('wrote $OUT')" "$A" "$B"
fi
