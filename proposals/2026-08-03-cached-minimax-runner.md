# Proposal: cached direct MiniMax bulk runner

Date: 2026-08-03
Thread: MiniMax fleet efficiency

## Gap

The stateful `codex-mm` harness is not currently safe to scale: Bifrost logs showed it routing to `CodexOpenAI / gpt-5.5`, not `Minimax / MiniMax-M3`. The lean `mini-pi` lane works for bounded tasks, but it does not emit a per-job usage record with raw MiniMax `cached_tokens` accounting.

The biggest measured efficiency gap is MiniMax caching. Direct go-llm-proxy calls with `cache_control` returned 2,816 cached tokens on a 2,887-token second call, while Bifrost `logs.cached_read_tokens` stays zero for MiniMax. We need a local runner that sends `cache_control`, records raw proxy usage, and keeps the work bounded.

## Evidence before action

Measured before this change:

- cached direct MiniMax bulk runner files: 0
- raw proxy cache metric artifacts: 0
- recent Bifrost MiniMax rows: 45 requests, 142,475 prompt tokens, 12,258 output tokens, 0 cached_read_tokens
- direct proxy cache proof: call 2 read 2,816 cached tokens out of 2,887 prompt tokens
- `codex-mm`: disabled for now because it misrouted to `CodexOpenAI / gpt-5.5`

Machine health:

- `/`: 26Gi available
- vault: 3.8Ti available
- load averages: 1.36 / 1.54 / 1.48

## Proposal

Add `scripts/mm-bulk-runner.mjs`:

- reads JSONL jobs from stdin
- sends OpenAI-style chat requests to local go-llm-proxy on `127.0.0.1:8789`
- adds `cache_control: {type: "ephemeral"}` to the user message by default
- limits concurrency with `MM_BULK_CONCURRENCY`, default 8
- records `prompt_tokens`, `completion_tokens`, and `prompt_tokens_details.cached_tokens`
- fails loudly if the response model is not `MiniMax-M3`

Use it immediately on a small bounded job set and commit the measured output.

## Measurement expected to move

- cached MiniMax runner files: 0 -> 1
- runner smoke jobs: 0 -> at least 4
- raw cached token records: 0 -> at least 4
- Bifrost/proxy routing proof: manual curl -> repeatable script output

## What would prove this wrong

If the runner cannot produce `model: MiniMax-M3` or raw `cached_tokens`, it does not solve the gap. If cache hits do not appear on repeated stable prompts, the cache_control placement is wrong or the proxy strips it.

## Non-goals

- Do not use codex-mm until routing is proven.
- Do not rotate or print secrets.
- Do not run unbounded prompts.
- Do not mutate corpus or canonical DBs.
