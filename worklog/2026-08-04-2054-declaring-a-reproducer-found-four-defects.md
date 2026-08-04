# Worklog: declaring a reproducer found four defects

Date: 2026-08-04T20:54:43Z (generated filename)
Thread: the reproducer that existed and was never declared

## One line of metadata

Last turn I nearly reported a false regression because I hand-rolled a probe
instead of running the reproducer I had written for that exact experiment. The
reproducer worked. It was simply never **declared** on the two metrics files it
reproduces, so nothing pointed me at it.

I declared it. Four defects fell out immediately — none of which the audit could
see before, because a file with no derivation and no reproducer is a file the
gate has nothing to check.

## What fell out

**`awaiting_decision.count`: asserted 6, derived 8.** The derivation counted
*all* numbered headings; the page counts only **unstruck** ones. Two correct
implementations of two different questions sharing one label — the defect class
of the day, and this time a gate caught it instead of me stumbling over it.
(It also revealed I had inserted decision 8 *before* decision 7 in the file.)

**`derivation-source-missing`.** I moved that 10.2 GB archive to the vault
this morning and left the derivation pointing at the old root path. The move was
verified; the pointer was not.

**`gate_selftest_cases`: asserted 12, derived 14.** I added two cases today and
did not update the number I had published. Caught **because it was declared** —
an undeclared count would have aged silently.

**`routing.requests`: 125, then 122, then 120 across three runs.** The query
uses a **sliding** window, `datetime('now','-24 hours')`, and my own 3-day
retention deletes rows underneath it. An equality check against a monotonically
moving value fails on every run and teaches the reader to ignore the gate.
Removed from derivations with a written rationale, because "un-derivable" must
never become a place to hide unfinished work — the gate says so in its own note.

## A number I did not publish

It was tempting to write **"99 of 121 metrics files have neither a derivation
nor a reproducer."** True, and alarmist: the audit only re-checks what live
claims actually ground in. The real figure is **3 of 14 load-bearing files** —
and two of those three were the GQ-008 files now covered by the declared
reproducer.

A true count of the wrong population is still a false claim.

## Five wrong keys in one session

Grounding ids live under `source.id`, not `id`. My own filter output read as
empty when it was filtering correctly. Each cost a round trip. The fix is not to
be more careful — it is to **read the structure before writing the query**.

| | |
| --- | ---: |
| verify | **exit 0** |
| gate self-test | **14 passed, 0 failed** |
| derivations re-derived | **32**, 0 skipped |
| remaining findings | 3, all `severity: info` |
