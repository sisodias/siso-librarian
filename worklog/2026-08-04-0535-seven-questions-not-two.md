# Worklog: the registry had seven God Questions; my page showed two

Date: 2026-08-04 05:35 UTC (from `date -u`)
Thread: Observatory — reading what I count

## What reading the works turned up

The 25 Works are genuinely 25 distinct records — 25 files, 25 ids, 25 names, all `record_type: work`. Unlike snapshots and assemblies, that count was honest.

But opening them surfaced something I should have found on the first night. **Seven of the 25 Works are God Questions**, registered as first-class records:

| Id | Title | Lifecycle |
| --- | --- | --- |
| GQ-001 | The Agent Workspace | active |
| GQ-002 | 10× the Agent Layer | active |
| GQ-004 | Best Software Primitive | experimental |
| GQ-005 | Where the Field Is Moving | experimental |
| GQ-006 | The Information Organ | active |
| GQ-008 | Model Routing Evidence | active |
| GQ-009 | The God Questions Observatory | active |

My observatory was showing **2 active questions** — GQ-009 and the GQ-010 I minted myself — because it read `questions/portfolio.json`, a file in this repo, rather than the registry.

The whole stated purpose of this page, in Shaan's words, is *"the God Questions and which one's being worked on"*. It was reporting my private working set as if it were the Library's question portfolio, and five registered questions were invisible.

GQ-009 is registered with the summary: *"A standing meta-question about how the Great Library should make SISO's highest-value questions visible, composable, continuously revisable, and connected to evidence and approved action."* That is the question I have been answering all night, and its canonical record was sitting three directories away, unread.

## What the page shows now

Read from the registry, not from my portfolio:

```
God Questions (registry)    7
With local claims           1 of 7
```

The snapshot carries all seven with lifecycle and last-updated, plus an explicit `unclaimed` list: GQ-001, 002, 004, 005, 006, 008.

`1 of 7` is a worse-looking number than `2 active questions`, and it is the true one. Six registered God Questions have no claim in this repo. That gap is now visible instead of hidden behind a count of my own work.

## The identifier I minted carelessly

I created GQ-010 last night without checking the registry. It does not collide — nothing in the registry references GQ-010 — but that is luck, not diligence. The registry is the canonical namespace and I assigned an id in it without looking.

The portfolio now records this, along with a note that GQ-003 and GQ-007 are unexplained gaps in the sequence, so the next id is chosen by checking rather than by incrementing.

| Measurement | Before | After |
| --- | --- | --- |
| questions shown | 2 (local portfolio) | 7 (registry) |
| claim coverage shown | not shown | 1 of 7, unclaimed named |
| portfolio's status | implied authoritative | documented as a working view |

## The pattern, one more time

Snapshots: counted 36 files, meant 1 record. Assemblies: counted 2, meant 1. Works: counted 25 correctly — and still missed that 7 of them were the exact thing the page exists to display.

Counting is not reading. I have now made that mistake in three consecutive directories, and the only reason it keeps surfacing is that I open the files instead of trusting the number. Re-derivation confirmed `works: 25` every single time and would never have found this.

## Residual

The 75 releases, 28 events, and 4 decisions are still unread. Given three-for-three so far, I expect at least one more of those labels to mean something other than what I assumed.

Local claims cover GQ-009 only. GQ-010 is mine and unregistered — it is a real question with real evidence, but it exists in this repo, not in the Library's canonical list, and I should not present it as equivalent to a registered Work.
