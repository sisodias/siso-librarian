# Proposal: build the first Great Library observatory

Date: 2026-08-03
Thread: Observatory / GQ-009 visibility

## Gap

The most visible unbuilt thing in `VISION.md` and `DECISIONS.md` is a URL on the Mac mini showing data bucket counts and which God Question is being worked. The tunnel exists, the data exists, and the Librarian repo has claim/question state, but there is no observatory artifact or local server.

This beats more internal schema hardening right now because it makes the Library legible: what exists, what is active, and whether MiniMax routing is verified.

## Evidence before action

Measured before implementation:

- No `observatory/` snapshot artifact.
- No `public/index.html` observatory page.
- No local observatory server script.
- Cloudflared is running as `/opt/homebrew/bin/cloudflared tunnel run --token ...`.
- No local Cloudflare config file was found to safely edit for public hostname routing.
- `/tmp/people_v2_gh.sqlite` is a zero-byte stub, so live people counts must come from `~/foundry-data/domains/people/people_v2.sqlite` read-only.

Measured source counts for initial snapshot:

- Registry: 25 works, 75 releases, 28 events, 4 decisions.
- Passages: 41,501,325 passages across 77,540 books.
- People graph: 280,722 people, 564,579 content edges, 2,517,910 topic edges, 845,004 external IDs.
- Claim layer: 1 production claim, 1 active portfolio question, 1 refresh entry.
- MiniMax route: verified by 8081 round trip returning `model: MiniMax-M3`.

## Proposal

Add a static observatory page and a tiny local HTTP server:

1. `scripts/build-observatory.mjs` reads local trusted sources and writes `observatory/snapshot.json` plus `public/index.html`.
2. `scripts/serve-observatory.mjs` serves `public/` on `127.0.0.1:8765`.
3. `observatory/com.siso.observatory.plist` records a LaunchAgent template for durable serving.

Do not edit Cloudflare tunnel routing blind. Public URL wiring should use the existing tunnel provider config or Cloudflare-side route data once found.

## Measurement expected to move

- observatory snapshot files: 0 -> 1
- observatory HTML pages: 0 -> 1
- local observatory server: absent -> smoke-tested on 127.0.0.1:8765
- visible bucket counts: absent -> registry, passages, people graph, claim layer, MiniMax route

## What would prove this wrong

If the page cannot be reached locally, or if any count is copied from a stale doc rather than measured from a local artifact, the observatory is not yet trustworthy.

## Non-goals

- Do not mutate canonical DBs.
- Do not edit Cloudflare tunnel config without locating the actual route source.
- Do not expose secrets or tokens in the public page.
