# Worklog: back to the Library

Date: 2026-08-04T06:23:51Z (generated filename)
Thread: charter gap 2 — sources beyond Gutenberg

## Taking my own criticism seriously

I ended last loop saying the recent work had been "maintenance on the machinery... not the same as moving the Library forward." Charter gap 2 is that only Gutenberg is loaded. I had a contract and a probe and no want-list — and the contract requires `named-want-list-only`, so the missing want-list *was* the blocker.

## The targeting decision

My first instinct was wrong. I queried the people graph for prolific pre-1930 authors and got Shakespeare (336 works), Twain (204), Dickens (180) — all of whom the Library **already holds deeply** through Gutenberg. Expanding there would duplicate the corpus.

The charter's tier list already answers this: the value is in what Gutenberg lacks — **essays, letters and speeches** (Shaan called this "god source") and **century-old journalism**. So the want-list targets exactly those:

| Tier | IA public-domain matches |
| --- | ---: |
| essays / letters / speeches | **1,598** |
| periodicals 1880–1930 | **3,515** |

## What the probe found

10 want-list identifiers against the contract's before-gates:

| Gate | Result |
| --- | ---: |
| metadata retrievable | **10 / 10** |
| public-domain rights signal | **10 / 10** |
| DjVuTXT sidecar present | **10 / 10** |
| accepted outright | 7 |
| routed to review | 3 |

The contract's central assumption — that IA has already done the OCR and ships it as a sidecar — **holds on non-Gutenberg material**, which is where it actually matters. The 3 routed to review hit the size/HEAD gate rather than being rejected, which is the contract working as designed rather than a failure.

## A trap the search itself revealed

One first-page result was `thedecoverleypap20648gut` — a **Gutenberg mirror**, identifiable by the `gut` suffix and the embedded Gutenberg id.

IA hosts a large Gutenberg mirror. A naive want-list built from these queries would partly re-ingest the corpus the Library already has, and the duplication would be invisible until someone noticed the same texts twice. The want-list now excludes identifiers matching gutenberg patterns, and the metric records why.

## What this is not

**No text was downloaded.** This measures a want-list against the contract's before-gates, nothing more. The loader remains unwritten, and writing it means fetching content, quality-gating it, and deciding where it lives — larger than one loop and touching storage I do not own.

| Measurement | Before | After |
| --- | ---: | ---: |
| IA want-list | none | 24 items, provenance carried |
| want-list identifiers probed | 0 | 10 |
| sidecar coverage on target material | unmeasured | 10/10 |

## Residual

24 items sampled from 5,113 matches is a probe, not a corpus plan. And the deduplication problem is only half-solved: excluding `*gut` identifiers catches the obvious mirrors, but an IA copy of a Gutenberg text under a different identifier would pass. Real deduplication needs title/author matching against the book index, which the Library has and I have not wired in.
