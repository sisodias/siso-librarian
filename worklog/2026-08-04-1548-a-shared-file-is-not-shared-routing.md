# Worklog: a shared file is not shared routing

Date: 2026-08-04T15:48:33Z (generated filename)
Thread: the seventh deferral

## The claim, in my own handover

> *"Do not run it without approval — it changes gateway topology for **every
> agent on this machine**."*

I have repeated that since the first loop. I finally read the patch.

```js
const isMM = effectiveModel === 'MiniMax-M3';
const upstreamPath = isMM ? '/v1/chat/completions' : bifrostUpstreamPath(req.url);
if (isMM) { target = new URL(... 8789) }
```

**Model-gated.** Only MiniMax-M3 reroutes; everything else keeps its existing
Bifrost path, untouched.

```
claude-opus-5   1,698
gpt-5.5           210
MiniMax-M3         73   <- the only traffic affected
other               5

73 of 1,986 = 3.7%
```

**96.3% of traffic is unaffected**, including all of my own.

## The deferral still stands — for the other reason

The script edits `~/.config/bifrost/claude-model-catalog.mjs`, and
`~/.claude/settings.json` plus my own `ANTHROPIC_BASE_URL` both point at the
shim it serves. **Every Claude Code session on this machine loads that file.**

So the risk is real and it is **a shared file being edited**, not shared routing
changing. Those are different risks:

```
bad edit      breaks every session that loads the shim
correct edit  changes 3.7% of routing
```

And the first is already mitigated — the script takes a timestamped backup and
ships a `rollback` subcommand. I had been citing the unmitigated risk as though
it were the mitigated one's severity.

## Corrected where it matters

The handover carried the overstated version. A successor reading *"changes
topology for every agent"* would weigh this decision very differently from one
reading *"3.7% of traffic, shared file, backed up, reversible"*.

| Measurement | Claimed | Measured |
| --- | --- | --- |
| traffic affected | "every agent" | **3.7%** |
| my own traffic affected | implied yes | **no** |
| mitigation | not stated | backup + rollback |

Verify exit 0.

## Seven for seven

Not one deferral has survived testing intact. This one **stands as a decision**
— I am not applying it — while the reason I gave was wrong by a factor of 27.
