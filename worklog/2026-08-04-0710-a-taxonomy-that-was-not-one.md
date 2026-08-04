# Worklog: a taxonomy that was not one

Date: 2026-08-04T07:10:37Z (generated filename)
Thread: GQ-005 — the three axes I said had no baseline

## The attempt

Last loop I recorded that the movement baseline covers **language only**, while
GQ-005 asks about categories, techniques, and projects. `awesome_sections` looked
like the categories axis: 119,565 rows carry both a section label and a creation
date, which is dense enough to cohort.

It is not a taxonomy.

```
distinct sections:   28,177
singletons:          10,185   (occur exactly once)
```

Better than a third of the vocabulary appears once. These are **free-text list
headings** — whatever a repo's curator typed — not categories.

The dense head is worse than sparse, because it looks usable:

| section | n |
| --- | ---: |
| Python | 3,445 |
| Other Lists | 3,271 |
| JavaScript | 2,525 |
| Go | 2,509 |
| Others | 2,231 |
| Tools | 2,084 |
| TypeScript | 1,589 |

Language names and junk buckets. A categories baseline built on this head would
either **restate the language baseline I already have** or measure nothing at
all. Both would have looked like a second axis.

## The check that settled it

I asked whether any *semantic* section — agents, LLMs, RAG, MCP — was dense
enough to cohort. The query returned **empty** at a 150-row floor. Loosening it:

```
🧠 Agent Skills              145
LLMs and ChatGPT             123
LLM Models                    90
🤖 Agent Harness Frameworks   88
```

145 rows across six cohorts is about **24 per year**, against the 5,000-repo
floor this same file already applies to languages. Applying a floor to one axis
and waiving it for another would make the second axis look like evidence
because I wanted a second axis.

## What I recorded instead

`categories_axis_rejected` in the baseline metrics, with coverage counts, the
head, the semantic head, and a verdict. GQ-005's evidence gap 2 now names the
measured obstacle rather than a general absence:

> A categories baseline needs a different **source**, not a different query.

That distinction is the useful part. Before this, "no baseline for categories"
read as work not yet done. It is now known to be work this corpus cannot do.

| Measurement | Before | After |
| --- | ---: | ---: |
| axes with a baseline | 1 of 4 | 1 of 4 |
| axes with a measured verdict | 1 of 4 | **2 of 4** |
| categories axis | untested | tested, rejected, with numbers |

Registry `d13713b`; verify exit 0.

## The honest shape of this loop

I produced **no new baseline**. The count of answered questions did not move,
and the axes-with-baselines number is unchanged at 1 of 4.

What changed is that one of the three remaining axes is no longer an open
invitation to build something plausible. I spent the loop finding out that a
promising field could not carry the weight I wanted to put on it, which is the
same shape as rejecting `star_delta` last loop — and in both cases the field
whose name matched my intent was the one that would have produced confident
nonsense.
