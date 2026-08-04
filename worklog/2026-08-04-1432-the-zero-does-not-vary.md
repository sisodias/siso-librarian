# Worklog: the zero does not vary

Date: 2026-08-04T14:32:50Z (generated filename)
Thread: fifth self-referential claim

## The only claim I could re-run rather than re-query

GQ-008's evidence is a **live experiment**, not a stored aggregate. So instead of
querying a log I re-ran it:

```
run 1   proxy  128 cached   bifrost  0 cached   (1,078 prompt tokens)
run 2   proxy 1024 cached                       (identical prompt, immediate)
```

The finding reproduces. It also **moved a lot**: 2,944 originally, then 1,024,
then 128, then 1,024 — on an identical prompt.

## Why I re-ran instead of recording 128

128 looked like a regression. It is cache **age**: the immediate re-run returned
to 1,024, so the low reading was a cold or expiring entry rather than a change in
behaviour.

Had I recorded the first run and stopped, the worklog would say *"proxy caching
degraded 8x"* — a false alarm from one draw of a value that legitimately varies.

## What actually reproduces

```
proxy    non-zero, magnitude varies with entry age
bifrost  EXACTLY ZERO, every run, no exception
```

**The zero does not vary.** That asymmetry is the whole claim, and it is what the
position should rest on — not the 2,944, which was one observation of a moving
number presented as a constant.

The position now says so: it quotes the range (2,944 / 1,024 / 128 / 1,024) and
states that any single magnitude is a point observation while the zero is flat.

Confidence 0.86 -> **0.88**.

| Measurement | Before | After |
| --- | ---: | ---: |
| self-referential claims | 2 | **1** |
| grounding ranges | 26 | **28** |
| GQ-008 confidence | 0.86 | 0.88 |

Verify exit 0.

## Five re-derived

```
GQ-010   under-evidenced      strengthened            0.68 -> 0.84
GQ-004   over-stated          provenance defect       0.83 -> 0.62
GQ-002   mechanism wrong      corrected               0.71 -> 0.79
GQ-006   arithmetic stale     confirmed, updated      0.79 -> 0.86
GQ-008   point observation    qualified, confirmed    0.86 -> 0.88
```

Five distinct failure modes, none of which the original grounding could have
revealed — because in every case the packet cited a summary I wrote rather than
the thing the summary described.
