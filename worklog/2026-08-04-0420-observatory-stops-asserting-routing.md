# Worklog: the observatory was showing a banner, not evidence

Date: 2026-08-04 04:20 UTC (from `date -u`)
Thread: Observatory — routing state

## The thing I built and then walked past all night

The observatory has been serving this to anyone who opened it:

```
MiniMax route    verified
```

A literal string. Hardcoded when I first built the page, citing a worklog in the snapshot's `routing` field as its justification.

That is the exact failure `prove-model-routing` exists to prevent, and I spent this whole session building verification machinery while it sat unchallenged three cards to the right of the counts I was so careful about. The uncomfortable part is not that it was wrong — MiniMax routing genuinely was repaired and proven at the time — it is that a *past* observation was being rendered as a *present-tense* claim, indefinitely, with no way for a viewer to tell the difference. Had routing broken at 02:00, the page would have kept saying `verified` until someone happened to re-read a worklog.

## What it does now

The builder queries Bifrost's own request log for `provider='Minimax' AND model='MiniMax-M3'` in the last 24 hours and reports what it finds:

```
MiniMax route (24h)    observed · 120 req
```

Live measurement at build time: **120 requests, 2,641,786 prompt tokens, 64,759 completion tokens**, provider and model read from the gateway's records rather than from a config label or a banner.

The request count also joins the snapshot's `derivations` block, so the auditor re-derives it on every `npm run verify` alongside the other counts. Routing state is now a measured number with a stated derivation, not prose.

## The honest-failure path, tested

A status card that can only say good news is another banner. So I checked what it does with nothing to observe, by narrowing the window to one second:

```
no recent traffic · 0 req
```

with the note: *"No MiniMax-M3 rows in the window. Routing may still be configured; it is simply unproven right now."*

That distinction matters. Absence of traffic is not evidence of breakage, and the page says so instead of either reassuring or crying wolf. Restored to 24h afterwards and confirmed it returns to `observed · 120 req`.

## A bug I nearly shipped

My first edit referenced `minimaxRouting.minimax_8801` — a typo for `8081` — with a `??` fallback to the correct field. It rendered perfectly, because the fallback silently absorbed the mistake. That is a defect that hides defects: any future rename of the real field would fall through to the typo'd `undefined` and the card would go blank or stale without complaint. Removed the fallback and the typo.

| Measurement | Before | After |
| --- | --- | --- |
| routing card source | hardcoded string | Bifrost request log |
| routing values re-derived per verify | 0 | 1 |
| behaviour with no traffic | would still say "verified" | "no recent traffic · 0 req" |
| snapshot derivations | 14 | 15 |

## Residual

The 24-hour window is a judgement call, not a measurement. A quiet day makes the card read `no recent traffic` even though routing is fine — correct but potentially alarming — while a broken route stays invisible for up to 24 hours if traffic ran earlier in the window. The card reports what the log contains; interpreting silence still needs a human, and the note says so rather than pretending the number resolves it.
