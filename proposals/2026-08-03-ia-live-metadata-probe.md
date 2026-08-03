# Proposal: run a bounded Internet Archive live metadata probe

Date: 2026-08-03
Thread: Internet Archive source adapter

## Gap

The IA adapter contract encodes rules from `SOURCES.md`, but this repo still lacks a current live probe artifact proving those rules against the network from this machine. Before writing a Foundry loader or downloading any text, the next safe step is a metadata-only probe over a tiny named want-list.

This moves the adapter from design to measured source evidence without bulk ingest.

## Evidence before action

Measured before this change:

- IA live probe artifacts: 0
- IA adapter contract files: 1
- source contract verifier coverage: 1
- machine health: `/` 25Gi available, vault 3.8Ti available, load averages 1.14 / 1.14 / 1.25

Constraints from `SOURCES.md` and `sources/internet-archive/adapter-contract.json`:

- use `rights:public domain`
- require `DjVuTXT`
- named want-list only
- metadata/HEAD checks before any body download
- no IA category browsing

## Proposal

Add `scripts/probe-ia-metadata.mjs` and run it against a small named want-list of public-domain identifiers. For each identifier:

1. fetch `https://archive.org/metadata/{identifier}`
2. check mediatype and rights/public-domain indicators
3. find a `DjVuTXT` sidecar
4. HEAD the sidecar URL
5. record status, bytes, sidecar name, and decision

No text body downloads in this loop.

## Measurement expected to move

- IA live probe artifacts: 0 -> 1+
- identifiers checked: 0 -> at least 3
- metadata fetches: 0 -> at least 3
- sidecar HEAD checks: 0 -> count of sidecars found
- accepted candidates: measured, not assumed

## What would prove this wrong

If the named want-list has low sidecar availability, wrong rights metadata, or blocked HEAD requests, the adapter contract needs a stricter review path before loader work.

## Non-goals

- Do not download text bodies.
- Do not build the Foundry loader yet.
- Do not crawl IA search results.
- Do not ingest or cache corpus content.
