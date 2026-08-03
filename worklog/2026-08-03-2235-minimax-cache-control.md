# Worklog: MiniMax cache-control proof

Date: 2026-08-03 22:35
Thread: MiniMax cache control

## What changed

Measured the cache path directly through go-llm-proxy after the fleet A/B attempt showed Bifrost `cached_read_tokens = 0` for MiniMax.

## Result

MiniMax caching works through the proxy when the request includes `cache_control`.

| Call | Prompt tokens | Output tokens | Cached tokens |
| --- | ---: | ---: | ---: |
| 1 | 2,887 | 20 | 128 |
| 2 | 2,887 | 20 | 2,816 |

The second identical call read 2,816 cached tokens. The capability exists.

## Interpretation

The zero `cached_read_tokens` in Bifrost does not prove MiniMax cannot cache. It means one or both of these is true:

1. normal harness calls do not send `cache_control`, and/or
2. Bifrost does not map proxy/OpenAI `prompt_tokens_details.cached_tokens` into `logs.cached_read_tokens`.

The direct proxy response exposes `prompt_tokens_details.cached_tokens`, so any cache experiment must inspect raw proxy usage until Bifrost accounting is fixed.

## Harness status

- `mini-pi` is the winning lane for bounded stateless tasks right now: three probes finished in 9s, 22s, and 34s with useful output.
- `codex-mm` is not a valid MiniMax fleet harness yet. It misrouted to `CodexOpenAI / gpt-5.5` and produced massive cached GPT traffic. It stays disabled until a single call proves `provider=Minimax, model=MiniMax-M3` in Bifrost or proxy logs.

## What I got wrong

I spawned five codex-mm panes before proving the harness from logs. That repeated the exact class of mistake the routing-proof skill warns about. I stopped the panes by exact pane id and switched back to direct MiniMax/mini-pi work.
