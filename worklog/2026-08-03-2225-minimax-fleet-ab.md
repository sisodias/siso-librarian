# Worklog: MiniMax fleet A/B first pass

Date: 2026-08-03 22:25
Thread: MiniMax fleet
Proposal: `proposals/2026-08-03-minimax-fleet-ab.md`

## What changed

Attempted a five-agent codex-mm fleet, measured it, then stopped it because routing proof showed it was not a valid MiniMax fleet.

## Before / after numbers

Machine health before spawning:

- `/`: 26Gi available
- vault: 3.8Ti available
- load averages: 1.25 / 1.26 / 1.33

Fleet attempt:

| Measurement | Value |
| --- | ---: |
| codex-mm agents spawned | 5 |
| first spawn placement failures | 5 (`--tab` target did not exist) |
| actual panes spawned | 5 in one tab |
| codex-mm panes kept | 0 |

Bifrost proof after attempt, recent-window query:

| Provider/model | Requests | Input tokens | Output tokens | Cached reads |
| --- | ---: | ---: | ---: | ---: |
| CodexOpenAI / gpt-5.5 | 224 | 22,668,611 | 57,168 | 21,893,120 |
| Minimax / MiniMax-M3 | 32 | 15,411 | 6,315 | 0 |

That proves the codex-mm panes were not valid MiniMax workers. They were closed by exact pane id, not pattern-killed.

## A/B result so far

`mini-pi` bounded probes:

| Task | Duration | Output | Result |
| --- | ---: | ---: | --- |
| cache-probe | 9s | 874 bytes | useful grep targets |
| cleanup-probe | 22s | 2,055 bytes | useful safe-move protocol |
| ia-probe | 34s | 1,916 bytes | useful IA pre-download checks |

`codex-mm` first pass:

- Spawned but noisy: MCP auth failures, skill warnings, 429s.
- Bifrost log showed dominant `CodexOpenAI / gpt-5.5`, not `Minimax / MiniMax-M3`.
- Config issue found: `codex-mm` uses `--profile minimax_m3`, but Codex reported the legacy `[profiles.minimax_m3]` config cannot be used with `--profile`; the profile layout needs repair before codex-mm is a valid fleet harness.

Interim lane rule: use `mini-pi` for stateless bounded work now. Do not scale codex-mm until its routing is proven by Bifrost logs.

## Cache finding

Bifrost totals showed `Minimax.cached_read_tokens = 0`, while a direct go-llm-proxy call returned `prompt_tokens_details.cached_tokens = 114`. So MiniMax/proxy can surface cached prompt tokens, but Bifrost is not recording them on its MiniMax path, and codex-mm is not yet a valid measured path.

## Corrections applied

Shaan corrected the concurrency diagnosis: true upstream ceiling is around 20 in-flight M3 requests; shim cap was raised to 16 outside this loop. The real fleet constraint is total in-flight requests, not agent count. codex-mm bypasses the shim, so it must remain small or be routed through a capped path.

Shaan also corrected herdr doctrine: one agent per tab. My split-only spawn put all panes in one tab; I stopped that layout.
