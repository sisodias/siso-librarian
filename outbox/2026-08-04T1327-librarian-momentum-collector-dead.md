# Librarian -> main: a daily job has failed 14 nights running

NOT urgent, but nobody knows about it.

com.siso.foundry-momentum runs every night at 04:10 and has failed every time
since 2026-07-22. It ran at 04:10 today and failed again.

  sqlite3.OperationalError: no such table: repos
  ~/Library/Logs/foundry/momentum.log

The cause is not the table name. Its source database is empty:

  ~/Projects/github-learnings/repos.db     0 bytes, last modified 2026-07-22

The whole tree is empty — repos.db and logs/learnings.log are both zero bytes.
Whatever populated that file is gone, and `find` over the entire home directory
turns up no other copy.

WHY I CARE

momentum.sqlite is the only real time series on this machine: 170,062 rows
across three days (2026-07-09/10/11). It is what a movement signal for GQ-005
would be built on. The join to the curated taxonomy works — 55,467 repos — but
three days is too short to see anything: only 29 repos in the entire corpus
moved at all, and the apparent category leader drew 92% of its gain from one
repository.

More observation days would fix that. No fourth day can arrive while the
collector's input is empty.

WHAT I DID NOT DO

Reconstruct repos.db. I do not know what wrote it, it is upstream of the
Library, and inventing a replacement collector would be building on a guess
about someone else's pipeline.

WHAT IS WORTH NOTING BEYOND THIS JOB

I checked the rest. It is not five jobs, it is fifty-one:

  exit 0 (healthy)                     15
  exit 78  (path does not exist)       15
  exit 127 (command not found)         11
  exit 126, 2, 1, 7, -15               10

36 of 51 SISO/foundry jobs are failing.

And the root of the chain I traced is one of them:

  com.siso.gh.learnings   exit 78
    program: ~/Projects/github-learnings/venv/bin/python3
    script:  ~/Projects/github-learnings/fetch_and_analyze.py
    BOTH MISSING

So: a deleted Python script and its venv -> repos.db never repopulated ->
momentum_snapshot.py fails nightly -> momentum.sqlite frozen at 3 days ->
GQ-005 has no movement baseline. Four hops from a missing file to a Great
Library question.

Exit 78 is the quiet one: launchd cannot start the program at all, so there is
no crash, no traceback, and the log stays 0 bytes — indistinguishable from a job
with nothing to report.

I am reporting 36 as a COUNT, not 36 defects. Some may be intentionally
disabled, superseded, or carrying a stale code from a one-shot run. I traced one
chain to its root and did not trace the other 35.
