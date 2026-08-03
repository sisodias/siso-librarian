# Worklog: Internet Archive live metadata probe

Date: 2026-08-03 22:45
Thread: Internet Archive source adapter
Proposal: `proposals/2026-08-03-ia-live-metadata-probe.md`

## What changed

Added and ran a metadata-only IA probe:

- `scripts/probe-ia-metadata.mjs`
- `metrics/2026-08-03-ia-live-metadata-probe.json`
- `metrics/2026-08-03-ia-live-metadata-probe-combined.json`
- this worklog

No text bodies were downloaded. The probe uses metadata GET plus sidecar HEAD only.

## Before / after numbers

| Measurement | Before | After |
| --- | ---: | ---: |
| IA live probe artifacts | 0 | 2 metrics files |
| identifiers checked | 0 | 8 |
| metadata OK | 0 | 8 |
| public-domain signal | 0 | 5 |
| DjVuTXT found | 0 | 7 |
| sidecar HEAD OK | 0 | 4 |
| accepted by current gate | 0 | 3 |

Live advancedsearch count:

- query: `mediatype:texts AND rights:"public domain"`
- result: 1,367,676 records

This is 35 fewer than `SOURCES.md` recorded, so the adapter must treat IA count as time-varying.

## Probe results

First named-famous sample:

- 3 metadata OK
- 2/3 DjVuTXT found
- 0/3 public-domain rights signal in metadata
- 0/2 sidecar HEAD OK (`401`/`403`)

Explicit `rights:"public domain"` search-result sample:

- 5 metadata OK
- 5/5 public-domain signal
- 5/5 DjVuTXT found
- 4/5 sidecar HEAD OK
- 3/5 accepted by current gate

## Findings

The core IA assumption holds for explicit public-domain records: DjVuTXT sidecars are present in the sample. But the probe found two important loader rules:

1. Famous identifiers may not expose rights metadata in the item metadata; seed from advancedsearch rights results or carry search-result rights into the want-list.
2. HEAD can fail with 401/403 even when metadata lists a sidecar with size and md5. HEAD failure should route to review, not permanent rejection.

## What I got wrong / what surprised me

The first famous-book sample looked bad because it was not seeded from `rights:"public domain"`. The adapter contract's named-want-list rule is still right, but the want-list needs provenance: how the identifier entered the list and what rights evidence came with it.
