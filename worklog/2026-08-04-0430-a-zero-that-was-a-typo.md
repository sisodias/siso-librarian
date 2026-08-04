# Worklog: the observatory reported 0 source inventories because of a hyphen

Date: 2026-08-04 04:30 UTC (from `date -u`)
Thread: Observatory — auditing my own caveats

## What I was checking

Two caveats have been sitting in the observatory snapshot since I built it, written from observations I never re-checked. Auditing my own stale assertions seemed a fitting use of the machinery I have been building all night.

**Caveat 1 holds.** `/tmp/people_v2_gh.sqlite` is still present and still exactly 0 bytes. The builder correctly uses the canonical graph instead.

**Caveat 2 was hiding a bug.** It said the source-inventory count "uses `registry/source_inventories`; if the schema path changes, update builder." The path never changed. It was wrong from the start — the directory is `source-inventories`, hyphenated. The builder had been looking at a path that does not exist and reporting the count as **0**.

## What was actually there

Six source inventories, including `gutenberg-corpus-2026-08-03.json` — the registration of the Library's actual corpus. The observatory has been telling every viewer the Library has zero registered source inventories while the Gutenberg corpus sat registered in the directory next door.

Checking the rest of the registry found two more directories the observatory never counted at all: `assemblies` (2) and `snapshots` (36).

| Registry bucket | Reported before | Actual |
| --- | ---: | ---: |
| source_inventories | 0 | 6 |
| assemblies | not counted | 2 |
| snapshots | not counted | 36 |
| works | 25 | 25 |
| releases | 75 | 75 |
| events | 28 | 28 |
| decisions | 4 | 4 |

Source inventories now appear on the page as their own card, since corpus registration is closer to the Library's purpose than most of what was already shown.

## Why my own audit machinery did not catch this

This is the part worth recording, because it is a real limit of what I built.

The auditor re-derives each count by re-running the derivation the snapshot declares. But the declaration carried the *same wrong path* as the builder — both said `source_inventories`, both found nothing, both agreed on 0. Perfect agreement, entirely wrong.

I named this exact hole two loops ago: *"the builder writes both the count and the derivation, so a bug that corrupted both consistently would pass."* I wrote that as a theoretical caveat. It was already happening, in the file I was writing it about.

What actually caught it was reading the directory listing with my own eyes and noticing the hyphen. No amount of self-consistent re-derivation would have surfaced it. The defence against this class is comparing against something that does not share the assumption — here, `ls` of the parent directory rather than a count of a named child.

| Measurement | Before | After |
| --- | ---: | ---: |
| snapshot counts re-derived per verify | 14 | 16 |
| registry buckets counted | 5 | 7 |
| source inventories visible | 0 (wrong) | 6 |

## Residual

The caveat is corrected to record what actually happened — hyphenated directory names, an underscore path silently counting 0 — rather than the fiction that a schema path might change.

The deeper issue stands: fifteen of the sixteen re-derived counts share their path assumption with the code that produced them. A wrong path, a wrong table name, a wrong filter, would pass unnoticed the same way. Re-derivation catches drift and typos in values; it does not catch a shared misunderstanding of where the truth lives. That needs a human reading a directory listing, or a second implementation that does not consult the first.
