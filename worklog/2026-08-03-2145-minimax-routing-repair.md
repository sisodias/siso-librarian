# Worklog: MiniMax routing repair

Date: 2026-08-03 21:45
Thread: MiniMax routing / Mac mini setup
Proposal: `proposals/2026-08-03-minimax-routing-repair.md`

## What changed

Repaired the mini's 8081 model-catalog route for `claude-minimax-m3[1m]` and proved it by round trip. The banner is no longer the evidence; the response body is.

Files/config touched outside this repo:

- `~/.config/bifrost/config.db`
- `~/.config/bifrost/claude-model-catalog.mjs`

Repo artifacts added:

- `proposals/2026-08-03-minimax-routing-repair.md`
- `metrics/2026-08-03-minimax-routing-repair.json`
- this worklog

## Before / after numbers

| Measurement | Before | After |
| --- | --- | --- |
| 8081 round trip for `claude-minimax-m3[1m]` | fail: `no keys found for provider: anthropic and model: claude-minimax-m3` | pass: response contains `"model":"MiniMax-M3"` |
| Direct Bifrost MiniMax route | fail after model rewrite: `invalid API key` | pass: provider `Minimax`, model `MiniMax-M3` |
| provider key mappings | 0 | 15 |
| proof method | static banner | live round trip |

## Backups made first

- `~/.config/bifrost/config.db.bak-minimax-routing-20260803T203939Z`
- `~/.config/bifrost/claude-model-catalog.mjs.bak-minimax-routing-20260803T203939Z`
- `~/.config/bifrost/config.db.bak-minimax-provider-key-20260803T204304Z`

## Implementation notes

The handover was directionally right but incomplete on the current mini state. The mini already had a `MiniMax Workers Key` virtual key and provider configs, but the join table `governance_virtual_key_provider_config_keys` was empty, so virtual keys were not linked to actual provider keys. I inserted mappings for existing virtual-key provider configs to matching `config_keys` rows.

The MiniMax provider key row on the mini was also stale. I copied the working value and model list from the laptop Bifrost config.

The final blocker was the 8081 shim path: even after rewriting `claude-minimax-m3[1m]` to `MiniMax-M3`, the shim sent requests to Bifrost's `/anthropic/v1/messages`, which searches provider `anthropic`. MiniMax is configured as a custom provider behind OpenAI-style chat completions. I patched `claude-model-catalog.mjs` so MiniMax requests go to `/v1/chat/completions`, then translate the OpenAI-style response back into Anthropic message shape for Claude Code.

I restarted the exact model-catalog PID, not a pattern kill. LaunchDaemon respawned it.

## Verification

Required command:

```bash
curl -sS -X POST http://127.0.0.1:8081/v1/messages \
  -H 'Content-Type: application/json' -H 'anthropic-version: 2023-06-01' \
  -d '{"model":"claude-minimax-m3[1m]","max_tokens":80,"messages":[{"role":"user","content":"Reply exactly OK and nothing else."}]}'
```

Observed proof:

```json
{
  "id": "msg_d5b1ca679d75f1cf28038c46",
  "type": "message",
  "role": "assistant",
  "model": "MiniMax-M3",
  "content": [{ "type": "text", "text": "OK" }],
  "stop_reason": "end_turn",
  "usage": { "input_tokens": 183, "output_tokens": 24 }
}
```

Direct Bifrost proof also passed through provider `Minimax` with model `MiniMax-M3`.

## Documents read first

- `HANDOVER-BRIEF.txt`
- `VISION.md`
- `HANDOVER.md`
- `CHARTER.md`
- `DECISIONS.md`
- `SOURCES.md`

## What I got wrong / what surprised me

I initially restarted `com.siso.codex-bifrost-shim`, but 8081 is served by `com.siso.model-catalog`. The failed round trip caught that mistake.

My first successful 8081 proof used `max_tokens:20`; MiniMax spent the budget on reasoning and returned empty text with `stop_reason:max_tokens`, but still proved `model:MiniMax-M3`. I reran with `max_tokens:80` and got content `OK`, which is the stronger proof.

This patch is deliberately small and direct. The better long-term fix is probably to teach Bifrost's Anthropic endpoint to route custom-provider Anthropic-compatible models, but tonight's requirement was to make Claude Code's 8081 route work and prove it.
