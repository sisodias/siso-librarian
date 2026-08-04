#!/usr/bin/env bash
# Route MiniMax traffic through go-llm-proxy (which honours cache_control)
# instead of Bifrost (which strips it), or roll that change back.
#
# Measured 2026-08-04: identical request, identical credential.
#   go-llm-proxy 8789 -> 2,944 of 3,033 prompt tokens cached
#   Bifrost      8080 -> 0 cached
#
# This exists so the change is a reviewed, reversible operation rather than a
# live edit. It backs up first, verifies after, and rolls back automatically if
# the health check fails.
#
#   minimax-cache-route.sh status    show current routing and cache behaviour
#   minimax-cache-route.sh apply     switch MiniMax upstream to the proxy
#   minimax-cache-route.sh rollback  restore the most recent backup
set -uo pipefail

SHIM="$HOME/.config/bifrost/claude-model-catalog.mjs"
PORT=8081
PROXY="http://127.0.0.1:8789"

fail() { echo "ERROR: $*" >&2; exit 1; }

# Probe the live shim with a repeated cacheable prompt and report cached tokens.
probe() {
  local big; big=$(/usr/bin/python3 -c "print('SISO cache route probe. '*220)")
  /usr/bin/python3 - "$big" <<'PY'
import json,subprocess,sys,time
big=sys.argv[1]
body={"model":"claude-minimax-m3[1m]","max_tokens":16,
 "system":[{"type":"text","text":big,"cache_control":{"type":"ephemeral"}}],
 "messages":[{"role":"user","content":"Reply OK"}]}
best=0; model=None
for _ in range(2):
    p=subprocess.run(['/usr/bin/curl','-sS','--max-time','60','-X','POST',
      'http://127.0.0.1:8081/v1/messages','-H','Content-Type: application/json',
      '-H','anthropic-version: 2023-06-01','-d',json.dumps(body)],capture_output=True,text=True)
    try:
        j=json.loads(p.stdout); u=j.get('usage',{}); model=j.get('model')
        best=max(best,u.get('cache_read_input_tokens') or 0)
    except Exception: pass
    time.sleep(2)
print(json.dumps({"model":model,"max_cache_read":best}))
PY
}

restart_shim() {
  local old; old=$(/usr/sbin/lsof -tiTCP:$PORT -sTCP:LISTEN 2>/dev/null || true)
  [ -n "$old" ] && kill -TERM "$old"
  sleep 4
  /usr/bin/sudo -n /bin/launchctl kickstart -k system/com.siso.model-catalog 2>/dev/null || true
  sleep 4
  /usr/sbin/lsof -tiTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1
}

case "${1:-status}" in
  status)
    echo "shim: $SHIM"
    grep -n "MINIMAX_UPSTREAM\|const upstream = " "$SHIM" | head -3
    echo "listener: $(/usr/sbin/lsof -tiTCP:$PORT -sTCP:LISTEN 2>/dev/null || echo none)"
    echo "probe: $(probe)"
    ;;

  apply)
    [ -f "$SHIM" ] || fail "shim not found"
    curl -sS --max-time 6 -o /dev/null "$PROXY/v1/models" || fail "proxy not answering on $PROXY — refusing to route to it"
    BAK="$SHIM.bak-route-$(date -u +%Y%m%dT%H%M%SZ)"
    cp -p "$SHIM" "$BAK"; echo "backup: $BAK"

    /usr/bin/python3 - "$SHIM" <<'PY'
import sys
p=sys.argv[1]; s=open(p).read()
old="      const upstreamPath = effectiveModel === 'MiniMax-M3' ? '/v1/chat/completions' : bifrostUpstreamPath(req.url);"
new="""      // MiniMax goes to the proxy, which honours cache_control; Bifrost strips
      // it. Everything else still goes to Bifrost. Revert with
      // scripts/minimax-cache-route.sh rollback.
      const isMM = effectiveModel === 'MiniMax-M3';
      const upstreamPath = isMM ? '/v1/chat/completions' : bifrostUpstreamPath(req.url);
      if (isMM) target = new URL(process.env.MINIMAX_UPSTREAM || 'http://127.0.0.1:8789');"""
if old not in s: raise SystemExit('anchor not found — shim may already be patched')
s=s.replace(old,new)
s=s.replace("    const sendUpstream = (target, allowFallback, transportAttempt = 0) => {",
            "    const sendUpstream = (targetIn, allowFallback, transportAttempt = 0) => {\n      let target = targetIn;")
open(p,'w').write(s)
print('patched')
PY
    [ $? -eq 0 ] || fail "patch failed"
    node --check "$SHIM" || { cp -p "$BAK" "$SHIM"; fail "syntax check failed — restored backup"; }

    restart_shim || { cp -p "$BAK" "$SHIM"; restart_shim; fail "shim did not come back — restored backup"; }
    RESULT=$(probe); echo "probe after apply: $RESULT"
    CACHED=$(echo "$RESULT" | /usr/bin/python3 -c "import json,sys; print(json.load(sys.stdin)['max_cache_read'])")
    MODEL=$(echo "$RESULT" | /usr/bin/python3 -c "import json,sys; print(json.load(sys.stdin)['model'])")
    if [ "$MODEL" != "MiniMax-M3" ] || [ "${CACHED:-0}" -eq 0 ]; then
      echo "health check FAILED (model=$MODEL cached=$CACHED) — rolling back"
      cp -p "$BAK" "$SHIM"; restart_shim; probe; exit 1
    fi
    echo "OK: routing applied, ${CACHED} tokens read from cache"
    ;;

  rollback)
    BAK=$(ls -t "$SHIM".bak-route-* 2>/dev/null | head -1)
    [ -n "$BAK" ] || fail "no route backup found"
    cp -p "$BAK" "$SHIM"; echo "restored: $BAK"
    node --check "$SHIM" || fail "restored file fails syntax check"
    restart_shim && echo "probe: $(probe)"
    ;;

  *) fail "usage: $0 {status|apply|rollback}" ;;
esac
