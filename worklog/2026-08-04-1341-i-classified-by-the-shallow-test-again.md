# Worklog: I classified by the shallow test again

Date: 2026-08-04T13:41:41Z (generated filename)
Thread: the last seven launchd failures

## The correction

I reported **10 runtime failures**, reasoning: *"the program exists in every
case, so these are real failures rather than dangling references."*

Three of them are the same missing-file defect, one layer deeper:

```
kengine-index      venv/bin/python: No such file or directory
learnings-health   can't open file '.../learnings-health/...'
pwa                Cannot find module '.../node_modules/.bin/vite'
```

The **interpreter** exists — `/bin/bash`, `node`, `python3` — and the thing it
was told to load does not. My test checked `ProgramArguments[0]`.

That is precisely the 127-vs-78 relationship I had already worked out two loops
ago and written up as a finding. I found the pattern, described it, and then
classified the next ten jobs by the shallow test anyway.

## The two easy ones are a pattern

```
property-classq    can't open '/Volumes/SISO-STORAGE-VAULT 1/...'
property-auctions  mkdir: /Volumes/SISO-STORAGE-VAULT 1: Permission denied
```

**Both** point at `SISO-STORAGE-VAULT 1`. Two jobs frozen against the same
transient mount name makes it a pattern rather than a typo — and both are fixed
by deleting two characters, with nothing lost.

## What is genuinely a runtime failure

Exactly one.

```
refresh-tailscale-upnp   curl (7): Failed to connect to 192.168.0.1 port 49153
```

The router is unreachable. Real, ongoing, and nothing to do with deleted files.

And one that is not a failure at all: `codex-bifrost-shim` at **-15** — killed by
SIGTERM. A negative exit code is a signal, not an error, and I had it in the
failure bucket.

## Revised

| Class | Was | Now |
| --- | ---: | ---: |
| deleted path | 26 | **29** |
| remount artifact | 0 | **2** |
| genuine runtime failure | 10 | **1** |
| killed by signal | 0 | **1** |
| malformed plist | 1 | 1 |
| untraced | 9 | **2** |

Verify exit 0.

## The lesson I keep having to relearn

**Finding a pattern is not the same as applying it.** I wrote up "exit 127 is
exit 78 one layer deeper" as a genuine insight, then spent the next loop sorting
jobs by whether `ProgramArguments[0]` exists — the exact test the insight said
was insufficient.

The 29 is now actionable as one sweep, up from 26. But the number moved because
I re-read logs, not because the classification was sound.
