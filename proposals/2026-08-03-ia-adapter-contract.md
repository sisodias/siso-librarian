# Proposal: Internet Archive public-domain adapter contract

Date: 2026-08-03
Thread: Source expansion / Internet Archive

## Gap

Only Gutenberg is loaded. `SOURCES.md` identifies Internet Archive public-domain texts as the next source: 1,367,711 public-domain text records, with 12 of 12 sampled items carrying pre-OCR `_djvu.txt` sidecars. The OCR is already done; the missing piece is an adapter contract and quality gate so the Library can expand without crawling blindly or ingesting legal/quality risk.

This follows the vision: map value, prefer indexes, and choose evidence by question. It does not attempt corpus-wide claim extraction.

## Evidence

From `SOURCES.md`, read this session:

- IA query scale: `mediatype:texts` + `rights:public domain` = 1,367,711 records.
- Metadata endpoint: `https://archive.org/metadata/<identifier>`.
- Text sidecar selection: `files[].format == "DjVuTXT"`.
- Sample: 12/12 top-downloaded 1890–1928 texts had DjVuTXT sidecars.
- PDF text extraction can be misleading: a real scan produced 3,707 words via `pdftotext` while IA sidecar produced 131,713 words.
- IA subject tags are folksonomy; use named want-lists, not category browsing.
- Public-domain filter is non-negotiable after Hachette v. IA.

MiniMax worker returned a bounded adapter checklist through the verified MiniMax route (`model: MiniMax-M3`). Useful constraints: named want-list only, sidecar required, schema stores index/metadata not warehouse claims, quality gate routes pass/review/fail.

## Proposal

Add an IA adapter contract in `sources/internet-archive/adapter-contract.json` and a validator in the existing verifier:

- source identity and endpoints
- legal filter: `rights:public domain`
- selector: DjVuTXT sidecar required
- want-list mode: named identifiers only
- quality gates: language, ASCII/noise/control-character thresholds
- measurements to record before/after any loader run

This is a contract, not a loader. It makes the next Foundry adapter implementable without re-deciding legal and quality rules.

## Measurement expected to move

- source adapter contract files: 0 -> 1
- source contracts covered by verifier: 0 -> 1
- IA legal/quality gates encoded: no -> yes
- loader implementation: 0 -> 0 by design

## What would prove this wrong

If a live sample of IA metadata no longer contains DjVuTXT for the named want-list, or if rights metadata is too inconsistent to trust `rights:public domain`, the adapter contract must route more records to review or pause ingestion.

## Non-goals

- Do not bulk download IA.
- Do not browse IA by subject category.
- Do not ingest copyrighted/borrow-only works.
- Do not extract claims corpus-wide.
