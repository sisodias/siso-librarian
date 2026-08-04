# Worklog: making review cheap, since I cannot make it happen

Date: 2026-08-04 09:15 UTC (from `date -u`)
Thread: GQ-009 watch trigger 5

## The gap I keep naming

Seven of seven questions claimed, nine claims, twenty grounding ranges — and **zero independently reviewed**. GQ-009's watch trigger 5 asks for a standing agent's proposal to survive independent review, and I cannot fire it by construction.

What I *can* affect is the cost of doing it. Today a reviewer would have to open **22 files** — ten claim packets plus twelve evidence sources — and resolve byte offsets by hand to check whether a single quote is real. That cost is a reason not to review, and unlike the reviewer's attention, it is mine to remove.

## What exists now

`REVIEW-PACKET.md`, rebuilt on every `npm run verify`: eight live claims in one document, each with its question, scope, position, confidence, proposed action, and **every grounding quote resolved from source at build time**.

Not copied from the claim — read from the file, at the byte range, and compared. If a range no longer matches, the packet prints **UNRESOLVED** with what it expected and what it found, and the build exits 4.

That last part matters. A packet that renders the claim's own copy of its quote would look identical whether the evidence was intact or rotten, which is the flattering-reading failure in a new costume.

Verified in both directions: corrupting one byte range produced one UNRESOLVED line and exit 4; restoring returned 0 and exit 0.

## A false alarm I checked rather than reported

`grep -c UNRESOLVED` returned **1** while the builder reported **0**. I checked before writing anything down — line 6 is the legend explaining what the marker means. The builder was right.

Small, but it is the same discipline that caught the 4-request outlier: when two counts disagree, look, do not pick the one that fits the story.

## What the packet asks for

The document opens by saying what a useful review is *not*: checking whether a claim is well-formed, which a gate already does. It asks three things instead — does the evidence support the position or a weaker one, is the confidence justified or a number attached to a hunch, and is the proposed action right and safe.

The observatory now shows `Claims awaiting review: 8 unreviewed` beside `Awaiting your decision: 5`, so a full portfolio cannot quietly read as a finished one.

| Measurement | Before | After |
| --- | ---: | ---: |
| files to open to review one claim | up to 22 | 1 |
| quotes resolved at build time | 0 | 20 |
| gates in `npm run verify` | 3 | 4 |
| claims independently reviewed | 0 | **0** |

That last row is the honest one. Nothing I did this loop changed it.

## The drift gate, again

Verify exited 2 mid-loop on GQ-005, from commit `d1c90db` touching its claim file. Grounding re-derived and intact before the timestamp moved. Fifth time tonight; the habit is now reflexive, which is what I wanted from it.

## Residual

I have reduced the friction and left the substance untouched. A reviewer still has to *want* to read eight claims and disagree with them, and the packet cannot manufacture that.

There is also a real risk in making claims easy to skim: a reviewer might approve a well-presented claim faster than a scattered one, and presentation is not evidence. The packet mitigates it by resolving quotes live rather than restating them, but a persuasive document is a persuasive document, and I wrote this one about my own work.
