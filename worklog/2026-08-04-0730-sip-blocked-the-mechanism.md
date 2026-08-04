# Worklog: SIP blocked the mechanism I had chosen

Date: 2026-08-04 07:30 UTC (from `date -u`)
Thread: escalation — testing the last untested segment

## The remaining gap, and what testing it found

Two loops ago the apply path was untested. Last loop I tested the patch and auth against a copy and found two defects. What remained was the restart and key-delivery sequence, which I had flagged as "only run against a manually-launched process."

Testing it found a third defect, and this one was fatal to the design rather than to the implementation.

## `launchctl setenv` cannot work on this machine

```
Could not set environment: 150: Operation not permitted while
System Integrity Protection is engaged
```

Not a permissions problem `sudo` could solve — SIP blocks it outright. My script delivered the proxy gate key via `launchctl setenv`, so `apply` would have failed its health check and rolled back **every single time**, on any machine with SIP enabled, which is the default.

The script was safe and non-functional. I had described it as one command to apply.

## What the daemon actually uses

Reading the plist showed the mechanism already in use:

```
EnvironmentVariables = Dict {
    CLAUDE_MODEL_CATALOG_MINIMAX_CAP = 16
}
```

The daemon takes environment from its own plist. That is how the MiniMax concurrency cap — raised to 16 earlier — reaches the process. The answer was sitting in the file the whole time, and I had reached for a general mechanism instead of looking at how this specific service is configured.

`apply` now writes the key into `EnvironmentVariables` with PlistBuddy, backs up the plist alongside the shim backup, and both the failure path and `rollback` restore it.

## The restart sequence, now verified

Tested against the **real service**, on the **unmodified** shim — nothing to roll back if it went wrong:

| Step | Result |
| --- | --- |
| pid before | 7376 |
| TERM + `launchctl kickstart -k` | — |
| pid after | 16106 |
| service responds | HTTP 200 |

The restart sequence works on the live daemon. That was the last unexercised segment of `apply`.

## Where the script now stands

| Segment | Status |
| --- | --- |
| patch anchor + resulting JS | verified against a copy |
| auth swap | verified — 2,944 cached tokens vs 0 |
| key delivery | **redesigned** after SIP blocked the original |
| restart on real daemon | verified — 7376 → 16106, HTTP 200 |
| plist backup + restore | written, not executed |

Every segment except plist backup/restore has now been exercised. Live routing remains unchanged; the shim is byte-identical to before this loop.

## The pattern, three for three

Three loops, three defects, each found only by execution: the missing auth swap, the undefined identifier, and now a key-delivery mechanism the OS forbids. Reasoning about the script produced a confident description each time. Running it produced a correction each time.

I described this script as "prepared" two loops ago. It has taken three rounds of testing to make that word true, and it is worth noting that none of those defects were subtle — they were a wrong header, an undefined variable, and a blocked syscall. Confidence in unexecuted code is worth very little, and mine was high.

## Residual

Plist backup and restore are the only unexecuted lines, and they need `sudo -n` to write to `/Library/LaunchDaemons`. That worked for `kickstart` in this test, so the privilege is available, but the copy itself has not run.

I am deliberately not exercising it, because writing to the daemon plist is a change to the machine's service configuration — the same class of decision as the routing change it enables, and not one to rehearse unilaterally.
