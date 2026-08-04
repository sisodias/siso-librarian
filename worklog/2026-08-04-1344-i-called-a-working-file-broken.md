# Worklog: I called a working file broken

Date: 2026-08-04T13:44:52Z (generated filename)
Thread: closing the launchd survey

## Retraction

I reported `com.siso.hermes.kengine` as having a **malformed plist** — invalid
XML, ExpatError at line 9 column 51 — and escalated it to Shaan as a real defect
nobody had found.

```
$ plutil -lint com.siso.hermes.kengine.plist
  OK
```

**The file is fine.** Line 9 is a comment containing `--loop`, and a double
hyphen inside an XML comment is illegal *per spec*. Python's expat enforces
that; Apple's parser does not.

I used a strict third-party parser on a vendor format and trusted its verdict
over the vendor's own tool. Then I put "your plist is broken" in a message to
Shaan. Retracted in the escalation with the reason.

The job's **actual** failure is the missing venv python — the same defect as the
other 29.

## A bookkeeping error too

My table said **untraced: 2**. Re-enumerating found zero: all ten non-78/127
failures already had diagnoses. I had subtracted wrong and reported a gap that
did not exist.

Two false statements in one loop's output — one about someone else's file, one
about my own arithmetic. Both found by re-running the enumeration instead of
trusting the summary I had written.

## The consolidation that makes it actionable

```
~/Projects/youtube-ai-research/venv/bin/python     MISSING
jobs depending on it:                              4
```

**One deleted virtualenv accounts for four failures.** So 30 deleted-path jobs
are *far fewer than 30 distinct causes* — restoring one venv fixes four, and the
`github-learnings` tree accounts for the momentum chain.

That is a materially better thing to hand over than "30 things are broken".

## Final

| Class | Jobs |
| --- | ---: |
| deleted path | **30** |
| remount artifact | 2 |
| genuine runtime failure | 1 |
| killed by signal (not a failure) | 1 |
| malformed plist | **0** (retracted) |
| untraced | **0** |

```
51 jobs, 15 healthy, 36 failing, 36 diagnosed
```

Verify exit 0.

## What I would tell myself

The survey is complete and two of its conclusions were wrong until I re-checked
them. The pattern across this whole thread: **every correction came from
re-running the measurement, never from re-reading my own notes.**
