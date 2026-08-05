# Worklog: the one language rule I never tested for false positives

Date: 2026-08-05T13:24:21Z (generated filename)
Thread: the sixth want-list

## What I wrote, and what I did

Two turns ago, adding Italian and French:

> *"a filter tuned on one example is a filter that excludes good books"*

Both of those got **two-marker** thresholds, chosen by counting false positives
on the real pool. The **German** rule — written first, never re-examined —
stayed at **one marker**.

## The measurement

On 2,045 candidates:

```
>= 1 distinct german marker   39 flagged
>= 2 distinct german markers   5 flagged
```

All five of the two-marker hits are unambiguously German. **Thirty-four were
wrong**, and both causes are the sort a single marker cannot distinguish:

| marker | what it actually was |
| --- | --- |
| `von` | a German **name particle** in *"Justus von Liebig : his life and work"* — an English biography |
| `des` | **French**, in *"Système des connaissances chimiques"* — 32 volumes labelled german |

## After

48 exclusions, every one genuinely foreign, and now correctly attributed:
*Système des connaissances chimiques* is labelled **french**, not german.
**Liebig is admitted.**

## A test of mine that failed for the wrong reason

My five-case check reported **4/5**, failing on the Priestley title. The cause
was my own truncated fixture — I cut the string before `der`, and the real
title carries three markers.

**The rule was right and my abbreviation was wrong.** I checked the real string
before touching anything.

## The sixth list

Chemistry (1,300 available), Botany (1,139), Geology (470) — **1,996 candidates,
954 eligible**. Music has 3,492 available and was skipped: his tier list puts it
under *store but do not extract*.

A bounded batch of 150 is fetching.
