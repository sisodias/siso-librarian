# Worklog: omitting the block bought exemption

Date: 2026-08-04T07:21:08Z (generated filename)
Thread: claim evidence — the disputed claim was not a one-off

## The structural finding

Last loop I disputed one claim whose metrics file named no source and declared
no derivations. I checked whether that was isolated. It was not:

**All seven live claims rested on metrics files with `source: null` and no
derivations block.** The disputed one was simply the first I looked at.

The audit could not have caught any of them. Line 181 read:

```js
if (!doc || typeof doc !== 'object' || !doc.derivations) continue;
```

A metrics file with no derivations was **skipped silently**. Omitting the block
bought exemption from the audit — the gate reported success across a corpus it
had never examined. This is the third time this session that a silent skip has
meant "checked" when it meant "not checked".

Fixed: a metrics file that a **live claim grounds in** and that declares no
derivations is now reported as `metrics-underived`. Scoped to grounded files
deliberately — flagging exploratory metrics nobody cites would train me to
ignore the finding. Superseded and disputed claims are excluded so a known
problem is not double-counted.

## Two claims closed, with opposite outcomes

**GQ-010 survives.** `edges_with_dependent_repos` re-derives to **867** and
`dependent_repos` max to **4,384,968** — both exact. Its metrics file named its
graph under a `graph` key rather than `source`, which is why it went unchecked
despite being checkable. Derivations added.

**GQ-002 survives, but only after I nearly mis-diagnosed it.** The Bifrost log
holds 1,978 rows; the metric asserts 408 CodexOpenAI requests. My first read was
that the log had rotated and the numbers were **no longer re-derivable at all**.

That was wrong, and I checked instead of recording it. The log is append-only —
counts have *grown*, not rotated. Re-deriving as-of the measurement timestamp:

| provider | rows | token-less | with tokens | asserted |
| --- | ---: | ---: | ---: | ---: |
| CodexOpenAI | 867 | 459 | **408** | 408 |
| Minimax | 207 | 64 | **143** | 143 |
| CodexProxy | 54 | 50 | **4** | 4 |

`raw_input` and `output` matched exactly on the first try; only the denominator
looked wrong. **`requests` means rows carrying token accounting**, not all rows —
correct, but unstated. Left implicit, the field name would have made every
per-request average wrong by roughly 2x for anyone re-deriving it.

Recorded as `requests_definition` rather than silently adding a matching query.

## Numbers

| Measurement | Before | After |
| --- | ---: | ---: |
| live claims with underived evidence | 7 (invisible) | **5 (visible)** |
| declared derivations re-derived | 15 | **18** |
| derivation mismatches | 0 | 0 |

Pushed with verify exit 0.

## Residual

Five metrics files still declare no derivations. GQ-008's is a **live
experiment** — two upstreams, identical body — and cannot be re-derived from a
log at all; it needs re-running, not a query. I have not decided how to
represent "reproducible only by repeating the experiment" and would rather leave
it flagged than invent a derivation kind that quietly re-reads a stored result.
