# Proposal: repair MiniMax routing on the Mac mini

Date: 2026-08-03
Thread: MiniMax routing / Mac mini setup

## Gap

The model catalog advertised `claude-minimax-m3[1m]`, but the banner was only a static catalog label. A real round trip through `http://127.0.0.1:8081/v1/messages` failed, so agents launched on the mini were burning the Claude plan instead of the intended MiniMax worker budget.

This is priority one because every future worker/fleet loop depends on cheap verified bulk routing.

## Evidence before action

Required round trip before repair:

```json
{"type":"error","error":{"type":"api_error","message":"no keys found for provider: anthropic and model: claude-minimax-m3"}}
```

Further tracing:

- `claude-minimax-m3[1m]` was stripped to `claude-minimax-m3` but not rewritten to `MiniMax-M3`.
- After fixing the rewrite, 8081 still failed because the shim forwarded to Bifrost's `/anthropic/v1/messages` endpoint, which searches provider `anthropic` and does not dispatch to custom provider `Minimax`.
- Direct Bifrost OpenAI-style chat route to `/v1/chat/completions` reached provider `Minimax` but initially returned `invalid API key`.
- Laptop Bifrost had a working MiniMax provider key; mini provider key differed.

## Proposal

Repair the mini routing path with backups first:

1. Back up `~/.config/bifrost/config.db` and `~/.config/bifrost/claude-model-catalog.mjs`.
2. Add missing virtual-key-to-provider-key mappings in `governance_virtual_key_provider_config_keys`.
3. Update the MiniMax provider key row from the laptop's working Bifrost config.
4. Patch the 8081 model catalog shim so `claude-minimax-m3[1m]` becomes `MiniMax-M3` and is sent to Bifrost's OpenAI chat endpoint for provider `Minimax`, then translated back into Anthropic message shape for Claude Code.
5. Verify by round trip containing `"model":"MiniMax-M3"`, not by banner.

## Measurement expected to move

- 8081 MiniMax round trip: fail -> pass
- direct Bifrost MiniMax route: invalid key -> pass
- provider key mappings: 0 -> nonzero
- verified worker budget route: no -> yes

## What would prove this wrong

If Claude Code cannot launch a worker through `claude-minimax-m3[1m]` despite the HTTP round trip passing, the HTTP shim fix is necessary but insufficient. The next proof would be launching a fresh worker process with that model and checking Bifrost logs for provider `Minimax`.

## Non-goals

- Do not rotate the MiniMax API key in this loop.
- Do not pattern-kill processes.
- Do not change Claude Opus reasoning-lane routing.
- Do not claim routing from the banner alone.
