# Worklog: the prepared script was broken

Date: 2026-08-04 07:15 UTC (from `date -u`)
Thread: escalation — testing the untested path

## What I criticised myself for, then fixed

Last loop I shipped `minimax-cache-route.sh` and ended by admitting its apply path had never run: *"a script whose failure path has never run is a hypothesis about a script."* That was the right criticism and the wrong place to leave it — I could test it without touching live routing, by running a patched **copy** of the shim on a spare port.

I did. It failed.

## Two real defects, found only by execution

**1. The auth swap was missing entirely.** The patched copy returned `401 invalid API key` on every request. go-llm-proxy is a separate service with its own gate credential; the Bifrost virtual key means nothing to it. My script swapped the upstream and left the authorization header pointing at the wrong service.

**2. `PROXY_KEY` was referenced but never defined.** Even after I added the swap by hand during testing, the injected code referenced a bare identifier that exists nowhere in the shim's scope. It would have thrown at request time.

Both would have been caught by the health check and auto-rolled-back, so the blast radius was contained — the safety design worked. But "safely fails" is not "works", and I had described it as prepared.

## The proof, once corrected

Patched copy on port 8099 against live shim on 8081, same request, same moment:

| Path | Model | cache_read |
| --- | --- | ---: |
| **patched → proxy** | MiniMax-M3 | **2,944** |
| live → bifrost | MiniMax-M3 | **0** |

That is the saving, demonstrated end-to-end through the actual shim code rather than inferred from a raw proxy call. The test shim was stopped afterwards; port 8099 is clear and the live listener (pid 7376) was never touched.

## What changed in the script

- the patch now swaps `authorization` to the proxy gate key and drops `x-api-key`
- it reads that key via `process.env.MINIMAX_PROXY_KEY`, properly scoped
- `apply` reads the gate key up front and **refuses** if it cannot, rather than proceeding to a guaranteed 401
- because the shim runs under launchd, the key is set with `launchctl setenv` — exporting in the calling shell would not reach it
- both the failure path and `rollback` now `unsetenv` the key

## The lesson, which I keep relearning in new forms

Every verification tool I built tonight checks that *recorded values match their sources*. None of them can tell whether *code does what its description claims*. The script's own comment said it routed MiniMax to the proxy; the code 401'd. Nothing in `npm run verify` would ever have noticed, because the script is not a number.

Executing it against a copy was the only check that worked — the same move that isolated the Bifrost defect an hour ago, when attempting the fix disproved my diagnosis. Twice tonight, running the thing beat reasoning about the thing.

| Measurement | Value |
| --- | ---: |
| live routing changes | 0 |
| defects found by executing the copy | 2 |
| cache_read via patched path | 2,944 |
| cache_read via live path | 0 |
| decisions still awaiting | 5 |

## Residual

`apply` is now *more* tested than it was — patch, auth, and end-to-end caching are all proven against a copy — but the launchd `setenv` and `kickstart` sequence has still only run against a manually-launched process, not the real service. The restart path is the remaining untested segment.

It also needs `sudo -n` for `launchctl setenv`. If that is unavailable when someone runs it, the key never reaches the shim, the health check fails, and it rolls back. Correct behaviour, and worth knowing before running it.
