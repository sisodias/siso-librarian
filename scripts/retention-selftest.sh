#!/usr/bin/env bash
# Prove the one script in this repo that DELETES data refuses when it should.
#
# WHY THIS EXISTS. enforce-log-retention.sh is the only script here that removes
# anything, and on 2026-08-05 it destroyed the archive it depends on: it
# refreshed the derivation slice from a live database whose rows it had already
# deleted, silently changing four declared derivation answers. That was found by
# a gate reading METRICS, not by anything testing the script itself.
#
# Every other gate in this repo has a self-test case proving it fires. The one
# that deletes did not. This closes that.
#
# Runs entirely on fixtures in a temp directory. It never touches the real log,
# the real slice, or the vault.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
W=$(mktemp -d "/tmp/retention-selftest-XXXXXX")
cleanup() { rm -rf "$W"; }
trap cleanup EXIT

PASS=0; FAIL=0
ok()   { echo "PASS  $1"; PASS=$((PASS+1)); }
bad()  { echo "FAIL  $1 — $2"; FAIL=$((FAIL+1)); }

# A fixture log: rows old enough to evict, rows young enough to keep, and body
# columns on both.
make_log() {
  local f="$1"
  rm -f "$f"
  sqlite3 "$f" "
    create table logs (id text primary key, timestamp text, provider text,
      virtual_key_name text, model text, prompt_tokens int, completion_tokens int,
      total_tokens int, cached_read_tokens int, status text,
      raw_request text, content_summary text, raw_response text);
    insert into logs values
      ('old1', datetime('now','-10 days'), 'CodexOpenAI','k','m',100,10,110,0,'ok','BIG','S','R'),
      ('old2', datetime('now','-9 days'),  'Minimax','k','m',200,20,220,5,'ok','BIG','S','R'),
      ('new1', datetime('now','-1 hours'), 'CodexOpenAI','k','m',300,30,330,0,'ok','BIG','S','R'),
      ('new2', datetime('now','-8 hours'), 'Minimax','k','m',400,40,440,0,'ok','BIG','S','R');"
}

echo "=== retention self-test: every case drives the REAL script ==="

# A usable fixture slice: holds the rows the derivation probes need.
mkslice() {
  rm -f "$1"
  sqlite3 "$1" "create table logs (id text primary key, timestamp text, provider text,
    virtual_key_name text, model text, prompt_tokens int, completion_tokens int,
    total_tokens int, cached_read_tokens int, status text);
    insert into logs values
      ('s1','2026-08-04 04:00:00','CodexOpenAI','k','m',45285517,109467,0,0,'ok'),
      ('s2','2026-08-04 05:00:00','CodexOpenAI','k','m',1,1,0,0,'ok');"
}

run() { LOG_DB_OVERRIDE="$1" SLICE_OVERRIDE="$2" bash "$ROOT/scripts/enforce-log-retention.sh" "${3:-}" 2>&1; }

# 1. Default is a dry run — it must not delete.
make_log "$W/a.db"; mkslice "$W/a-slice.db"
before=$(sqlite3 "$W/a.db" "select count(*) from logs;")
out=$(run "$W/a.db" "$W/a-slice.db")
after=$(sqlite3 "$W/a.db" "select count(*) from logs;")
if [ "$before" = "$after" ] && printf '%s' "$out" | grep -q 'dry run'; then
  ok "default invocation is a dry run and deletes nothing"
else bad "default is a dry run" "$before -> $after"; fi

# 2. No slice at all must stop it dead. This is the guard that makes deletion safe.
make_log "$W/b.db"
before=$(sqlite3 "$W/b.db" "select count(*) from logs;")
out=$(run "$W/b.db" "$W/does-not-exist.db" --apply)
after=$(sqlite3 "$W/b.db" "select count(*) from logs;")
if printf '%s' "$out" | grep -q 'REFUSING' && [ "$before" = "$after" ]; then
  ok "refuses to delete with no slice, and deletes nothing"
else bad "refuses with no slice" "exit path allowed $before -> $after"; fi

# 3. A slice that cannot answer the probes must stop it.
make_log "$W/c.db"
sqlite3 "$W/c-slice.db" "create table logs (id text primary key, timestamp text, provider text,
  prompt_tokens int, completion_tokens int, cached_read_tokens int);"   # empty: answers nothing
before=$(sqlite3 "$W/c.db" "select count(*) from logs;")
out=$(run "$W/c.db" "$W/c-slice.db" --apply)
after=$(sqlite3 "$W/c.db" "select count(*) from logs;")
if printf '%s' "$out" | grep -q 'REFUSING' && [ "$before" = "$after" ]; then
  ok "refuses when the slice answers nothing (empty is not zero)"
else bad "refuses on an unanswering slice" "$before -> $after"; fi

# 4. With a good slice, --apply evicts ONLY rows past the window.
make_log "$W/d.db"; mkslice "$W/d-slice.db"
out=$(run "$W/d.db" "$W/d-slice.db" --apply)
kept=$(sqlite3 "$W/d.db" "select group_concat(id) from logs order by id;")
if [ "$kept" = "new1,new2" ] || [ "$kept" = "new2,new1" ]; then
  ok "evicts only rows past the window (kept: $kept)"
else bad "evicts only expired rows" "kept: $kept, expected new1+new2"; fi

# 5. Body columns pruned, token columns untouched — the derivations must survive.
tok=$(sqlite3 "$W/d.db" "select sum(prompt_tokens)||'/'||sum(completion_tokens) from logs;")
bodies=$(sqlite3 "$W/d.db" "select count(*) from logs where raw_request is not null;")
if [ "$tok" = "700/70" ] && [ "$bodies" = "1" ]; then
  ok "prunes bodies older than 6h, preserves every token column"
else bad "prune preserves tokens" "tokens=$tok (want 700/70), rows-with-bodies=$bodies (want 1)"; fi

# 6. The slice must ACCUMULATE — the bug that actually happened on 2026-08-05.
make_log "$W/e.db"; mkslice "$W/e-slice.db"
run "$W/e.db" "$W/e-slice.db" --apply >/dev/null
has=$(sqlite3 "$W/e-slice.db" "select count(*) from logs where id='s1';")
if [ "$has" = "1" ]; then
  ok "slice keeps rows absent from live (accumulates, not replaces)"
else bad "slice accumulates" "row s1 vanished — the slice was rebuilt from a source that had lost it"; fi

echo
echo "=== $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] || exit 1
