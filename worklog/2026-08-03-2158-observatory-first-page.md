# Worklog: first Great Library observatory page

Date: 2026-08-03 21:58
Thread: Observatory / GQ-009 visibility
Proposal: `proposals/2026-08-03-observatory-first-page.md`

## What changed

Built the first local Great Library observatory page and snapshot.

Added:

- `scripts/build-observatory.mjs`
- `scripts/serve-observatory.mjs`
- `observatory/snapshot.json`
- `observatory/com.siso.observatory.plist`
- `public/index.html`
- `metrics/2026-08-03-observatory-first-page.json`
- this worklog

The page shows bucket counts, active God Question state, claim-layer counts, and MiniMax route status. It is smoke-tested locally at `http://127.0.0.1:8765/`.

## Before / after numbers

| Measurement | Before | After |
| --- | ---: | ---: |
| observatory snapshot files | 0 | 1 |
| observatory HTML pages | 0 | 1 |
| local observatory server | absent | `127.0.0.1:8765` smoke-tested |
| visible bucket count groups | 0 | 5 |
| HTML response bytes | 0 | 4,139 |

## Bucket counts in the first snapshot

| Bucket | Count |
| --- | ---: |
| registry works | 25 |
| registry releases | 75 |
| registry events | 28 |
| registry decisions | 4 |
| passages | 41,501,325 |
| books with passages | 77,540 |
| people | 280,722 |
| content edges | 564,579 |
| topic edges | 2,517,910 |
| external IDs | 845,004 |
| active questions | 1 |
| production claims | 1 |
| refresh entries | 1 |

## Verification

Build:

```bash
node scripts/build-observatory.mjs
```

Smoke:

```bash
node scripts/serve-observatory.mjs
curl -sS http://127.0.0.1:8765/ >/tmp/observatory-smoke.html
wc -c /tmp/observatory-smoke.html
```

Observed: `4139 /tmp/observatory-smoke.html`.

## What I got wrong / what surprised me

`/tmp/people_v2_gh.sqlite` exists but is a zero-byte stub. The handover named it as the working people graph, but the measured current usable graph is `~/foundry-data/domains/people/people_v2.sqlite` at 1.1G. The builder uses that DB read-only and records the caveat in the snapshot.

Cloudflared is running, but it is token-managed and I found no local config file to safely edit for hostname routing. I did not mutate tunnel routing blindly. The local server is ready; public URL mapping remains a separate deploy step once the route source is identified.

I also stopped using stale docs for counts: the observatory measures local artifacts directly wherever possible.
