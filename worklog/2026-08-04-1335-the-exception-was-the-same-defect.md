# Worklog: the exception was the same defect

Date: 2026-08-04T13:35:09Z (generated filename)
Thread: closing the launchd survey

## The one that did not fit

I reported *"one exit-78 job has its program present and still fails — I didn't
find why"* and named it as the exception rather than rounding it away.

`com.siso.foundry-interface`. Its program is `/opt/homebrew/bin/node`, which
exists — so my missing-program test passed it.

```
WorkingDirectory   ~/foundry-interface     DOES NOT EXIST
arguments          node_modules/tsx/dist/cli.mjs  server.ts
```

**Relative paths.** launchd fails with EX_CONFIG before running anything, which
is why its error log sits at 0 bytes.

Same defect, different field. My test checked `ProgramArguments` and never
looked at `WorkingDirectory` — so exit-78 is **15 of 15**, not 14 of 15, and the
gap was in my check rather than in the fleet.

## The remaining ten are genuinely different

```
refresh-tailscale-upnp  7      program present
pwa                     1      program present
kengine-index         126      program present
learnings-health        2      program present
property-classq         2      program present
property-auctions       1      program present
foundry-momentum        1      program present
agentbase               7      program present
codex-bifrost-shim    -15      program present
```

**Every program exists.** These jobs start and then fail — real runtime failures,
not dangling references. `foundry-momentum` is the one I already traced: it runs
correctly and dies on an empty source database.

## A malformed plist, found by being crashed into

My survey loop died mid-scan:

```
xml.parsers.expat.ExpatError: not well-formed (invalid token): line 9, column 51
```

`com.siso.hermes.kengine`'s plist is **invalid XML**. Two things worth noting:
it is a real defect nobody had reported, and my unguarded loop would have hidden
the six jobs listed after it. I guarded the parse and re-ran rather than
recording a partial scan as complete.

## Final classification

| Class | Jobs | Fix |
| --- | ---: | --- |
| deleted path | **26** | one sweep: restore the file or unload the job |
| runtime failure | **10** | individually different |
| malformed plist | **1** | invalid XML |

```
36 failing -> 36 classified
```

Three loops ago this was "momentum.sqlite stopped recording". Verify exit 0.

## Still not repaired

Nothing restored, nothing unloaded. These are operational jobs and unloading is
destructive. Nine of the ten runtime failures are untraced — I stopped at
classification because that is what makes the 26 actionable as one decision, and
the remaining nine each need their own investigation.
