# Worklog: the tier/score gap is not actionable on this machine

Date: 2026-08-04 00:25
Thread: Gap 6 — SISO_Knowledge tier/score contradiction

## What I set out to do

Charter gap 6 says SISO_Knowledge tier/score is 96.6% self-contradictory and the fix is blocked because no scorer exists. `DECISIONS.md` adds the measured reason the naive fix was *correctly* not applied: deriving tier from score moves the distribution from 5,292 A / 1,647 B / 34 C to 13 A / 6,970 B / 0 C — 99.8% in one band. That trades a visible contradiction for invisible flatness.

I went to build the missing scorer. I did not get that far, and the reason is worth recording.

## What I found instead

`fix_tier_score.py` exists at
`siso-foundry/pipelines/books/fix_tier_score.py` and is well-documented. It names the root cause precisely: `queries/add_book.py` writes `score: 0.0` unconditionally at lines 71 and 87, while `queries/rebuild_index.py` uses `setdefault` at line 90 so the fallback never fires once a page carries an explicit score. Score is a constant stamped at ingest; tier is curator-set evidence. They cannot agree by construction. Two writers, no arbiter — the exact failure mode `VISION.md` warns about.

The script hardcodes `LIB = /Users/shaansisodia/SISO_Workspace/SISO_Knowledge`.

**That path does not exist on this machine.** Neither does the corpus anywhere else on it.

## The checks

| Check | Result |
| --- | --- |
| `SISO_Knowledge` dir under `~` or vault, maxdepth 6 | not found |
| `PAGE_SCHEMA.md` under `~` or vault, maxdepth 8 | not found |
| any `*.md` under `SISO_Workspace` with `^tier:` frontmatter | zero files |
| `queries/add_book.py` (the writer named in root cause) | not found |
| laptop reachable | offline — ping fails, ssh times out |

Three independent angles agree. This is not a path typo; the corpus is not here.

## Why this is worth a worklog rather than silence

A ranked gap that cannot be worked is itself a finding. Without this note, the next loop — or the next agent — re-reads the charter, sees gap 6 unstruck, and spends the same cycles rediscovering the same absence. That is precisely the waste the enrichment log's negative results were written to prevent.

It also revises what the gap *is*. The charter frames it as "blocked because no scorer exists." On this machine the blocker is upstream of that: there is no corpus to score. Those need different actions. A scorer can be written speculatively; a missing corpus cannot be scored at all.

## What I did not do, and will not

I did not write a scorer against a corpus I cannot measure. The whole reason the naive fix was rejected is that it was evaluated against real distributions — 5,292/1,647/34 collapsing to 13/6,970/0. A scorer built blind, with no pages to validate against, would be exactly the plausible-wrong-answer failure that `HANDOVER.md` calls the worst kind. Writing one now would produce something that looks like progress and is untested by construction.

## What would unblock it

Either the corpus arrives on this machine, or the work happens where it lives. The laptop is the obvious candidate and is currently offline, so I could not confirm it. When it is reachable, one command settles it:

```bash
ssh laptop 'ls -d ~/SISO_Workspace/SISO_Knowledge && find ~/SISO_Workspace/SISO_Knowledge/sections -name "*.md" | wc -l'
```

If it is there, the honest sequence is: measure the real score/tier distribution first, then design a scorer against evidence that actually exists, then dry-run and compare band distributions *before* any `--apply`. The existing script already defaults to dry-run and is read-only without `--apply`, which is the right shape.

## Charter correction

Gap 6 should read that it is blocked on **corpus availability on this host**, not only on the absence of a scorer. I am leaving the charter text alone for now rather than editing it on a single offline check — if the laptop confirms the corpus lives there, the accurate phrasing is "wrong machine," which is a different correction than "corpus missing."
