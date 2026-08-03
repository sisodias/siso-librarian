# Worklog: cached direct MiniMax bulk runner

Date: 2026-08-03 22:42
Thread: MiniMax fleet efficiency
Proposal: `proposals/2026-08-03-cached-minimax-runner.md`

## What changed

Added `scripts/mm-bulk-runner.mjs`, a bounded direct MiniMax bulk runner through local go-llm-proxy. It adds `cache_control`, captures raw proxy usage, and fails if the response model is not `MiniMax-M3`.

Added:

- `scripts/mm-bulk-runner.mjs`
- `metrics/2026-08-03-mm-bulk-runner-smoke.jsonl`
- `metrics/2026-08-03-cached-minimax-runner.json`
- this worklog

## Before / after numbers

| Measurement | Before | After |
| --- | ---: | ---: |
| cached MiniMax runner files | 0 | 1 |
| raw proxy cache metric artifacts | 0 | 1 |
| smoke jobs run | 0 | 4 |
| smoke jobs ok | 0 | 4 |
| prompt tokens in smoke | 0 | 851 |
| completion tokens in smoke | 0 | 662 |
| cached tokens captured in smoke | 0 | 512 |

Smoke results:

| Job | Model | Prompt | Output | Cached | Result |
| --- | --- | ---: | ---: | ---: | --- |
| repeat-1 | MiniMax-M3 | 223 | 40 | 128 | OK |
| repeat-2 | MiniMax-M3 | 223 | 41 | 128 | OK |
| safe-move | MiniMax-M3 | 203 | 300 | 128 | length-limited but valid |
| ia-checks | MiniMax-M3 | 202 | 281 | 128 | valid JSON-ish output |

## Accounting note

The runner talks directly to go-llm-proxy on `127.0.0.1:8789`, so its jobs do not appear as `Minimax` rows in Bifrost. The raw proxy response contains `usage.prompt_tokens_details.cached_tokens`, which Bifrost currently does not populate for MiniMax. For proxy-only jobs, the JSONL output is the source of truth for cache accounting.

## What I got wrong / what surprised me

The repeated short smoke prompt only cached 128 tokens on both calls. The earlier long direct proxy test cached 2,816 tokens on the second call. So cache effectiveness is prompt-size and request-shape dependent; short prompts prove accounting, not maximum savings.

This runner is the right lane for bounded bulk until `codex-mm` is repaired. `codex-mm` remains disabled because Bifrost proved it misroutes to `CodexOpenAI / gpt-5.5` under current configuration.
