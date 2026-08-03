# Proposal: MiniMax fleet harness A/B and cache investigation

Date: 2026-08-03
Thread: MiniMax fleet

## Gap

The mini must run a real MiniMax fleet, not one Opus lane pretending to be continuous. `FLEET-BRIEF.txt` adds two concrete questions:

1. Which harness wins for which task shape: `codex-mm` or `mini-pi`?
2. Why do Bifrost logs show MiniMax `cached_read_tokens = 0` while MiniMax supports caching directly?

## Evidence before action

Machine health before spawning:

- `/`: 26Gi available, 41% capacity.
- Vault: 3.8Ti available.
- Load averages: 1.25 / 1.26 / 1.33.
- Herdr initially had one active pane: `librarian`.

Routing proof before fleet:

- Recent Bifrost log included real `Minimax MiniMax-M3` rows.
- Cache totals from Bifrost: `Minimax` had 153 requests, 2,012,640 prompt tokens, 51,297 completion tokens, and `cached_read_tokens = 0`.
- `CodexOpenAI` had 23,581,696 cached read tokens, proving Bifrost cache accounting works for at least one provider.

## Proposal

Spawn five MiniMax-intended persistent agents in herdr:

- `mm-observatory`
- `mm-cache`
- `mm-ia`
- `mm-cleanup`
- `mm-awesome`

Run mini-pi bounded probes on comparable task shapes, then measure tokens and completion/stall status from Bifrost logs and pane output.

If codex-mm is misconfigured, fix the harness before scaling more work.

## Measurement expected to move

- herdr MiniMax fleet panes: 0 -> 5+
- MiniMax request count: increase measurably in Bifrost logs
- A/B records: 0 -> at least 3 mini-pi bounded probes and 1 codex-mm probe
- cache hypothesis: unknown -> narrowed to harness/proxy/Bifrost accounting path

## Non-goals

- Do not trust banners.
- Do not pattern-kill processes.
- Do not rotate keys.
- Do not delete or mutate unrelated machine state.
