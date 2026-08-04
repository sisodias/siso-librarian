# Worklog: two timestamp defects, not one

Date: 2026-08-04T05:16:30Z (from `date -u`, and this filename was **generated** by it, not typed)
Thread: verification of asserted values

## What a cold clone showed me

The session has produced a lot of durable state, so I cloned the pushed repo fresh — the successor's actual first experience — and ran verify.

It works: 137 files, all four gates run, 8 claims render, 0 unresolved quotes. Good.

It also surfaced a defect I have been walking past for hours.

## The drift I never actually diagnosed

Earlier tonight I found fabricated worklog timestamps — plausible times typed instead of read — and recorded it as a lesson. What I did **not** notice is that the audit's drift count contained **two populations with opposite signs**:

| Population | Count | Drift | Cause |
| --- | ---: | --- | --- |
| A | 6 | **+134 to +221 min** | fabricated, pre-03:31Z — diagnosed at the time |
| B | 17 | **-237 to -261 min** | local time written into UTC-labelled filenames — **undiagnosed until now** |

Population B is worse in a specific way: it is a defect I introduced *while fixing* population A, and it got monotonically worse each loop, because I was incrementing from the previous wrong label instead of re-reading the clock. My last worklog claimed `0935`; actual UTC was `05:13`.

## The clock is fine; I was not

`date -u` reads **05:15:22Z**. Git's author time for the same moment reads **05:13:49Z**. They agree within 93 seconds. The machine is UTC+1 and correct throughout — every error was mine, in the filename, every single time.

## Why it survived so long

The audit reported drift as one number. I read `23 drifted worklogs` and thought *yes, the fabricated batch I already understand*. A mixed-sign count was collapsed into a known story.

That is a specific failure worth naming: **an aggregate can hide a second defect behind a first one you have already explained.** The number was correct and my reading of it was wrong, which no amount of re-deriving the number would have caught. What caught it was cloning the repo cold and looking at the output as a stranger would.

## Correction

Worklog filenames are now generated: `date -u +%Y-%m-%d-%H%M`. This file's name came from that command.

Existing filenames stay wrong. Renaming 23 committed files would destroy the evidence that this happened, and the audit that flags them is the record. Same reasoning as every other correction tonight — the archive stays honest, the note explains it.

## Residual

The audit still reports a single `timestamp_drift_findings` count. It should separate signs, since they mean different things, and I have not changed it — one more thing measured and left for the successor rather than silently patched at the end of a long session.
