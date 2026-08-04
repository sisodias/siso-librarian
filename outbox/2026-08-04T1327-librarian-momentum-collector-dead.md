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

I have since traced the two largest groups, so it is no longer just a count:

  exit 127   11 jobs   11 of 11 point at a script that does not exist
  exit 78    15 jobs   14 of 15 point at a program that does not exist

25 of those 26 failures are ONE defect: files deleted while the launchd jobs
referencing them stayed loaded. Not 26 independent problems.

The mechanism differs slightly. Exit 78 means launchd could not start the
program. Exit 127 means launchd started /bin/bash fine and bash then could not
find the script — one layer deeper, same root cause. Verified directly:
`bash /tmp/definitely-not-here.sh` returns exactly 127.

I found the exception. com.siso.foundry-interface runs /opt/homebrew/bin/node,
which exists — so my "missing program" test passed it. But its WorkingDirectory
is ~/foundry-interface, and that directory does not exist. launchd fails with
EX_CONFIG before running anything, which is why its error log is 0 bytes. Its
arguments are relative paths that only resolve inside that directory.

Same defect, different field. So exit-78 is 15 of 15.

FINAL CLASSIFICATION OF ALL 36

  deleted path        29
  remount artifact     2   point at "SISO-STORAGE-VAULT 1", a mount that healed
  genuine runtime      1   refresh-tailscale-upnp: router at 192.168.0.1 unreachable
  killed by signal     1   codex-bifrost-shim, exit -15 (SIGTERM, not a failure)
  untraced             0

I revised this after tracing further. I had reported 10 "runtime failures" on
the grounds that the program existed. Three of them are the same missing-file
defect one layer deeper — the interpreter exists, the thing it loads does not:

  kengine-index     venv/bin/python: No such file or directory
  learnings-health  can't open file .../learnings-health/...
  pwa               Cannot find module .../node_modules/.bin/vite

That is the same 127-vs-78 relationship I had already worked out, and I still
classified by the shallow test. The corrected count is 29 deleted paths.

THE TWO EASY ONES

property-classq and property-auctions both point at "/Volumes/SISO-STORAGE-VAULT 1"
— with a space and a 1. A macOS remount artifact from a volume that mounted
while an old mount point was held. The numbered mount is gone; the real paths
exist. Both are fixed by deleting two characters from a plist.

Two jobs share it, so it is a pattern, not a typo.

The 26 are one sweep: restore the file or unload the job.

The 10 are individually different — the program is present in every case, so
these are real failures rather than dangling references. foundry-momentum is one
of them (it runs fine and dies on the empty repos.db). I have not traced the
other nine.

RETRACTION: I said com.siso.hermes.kengine's plist was invalid XML. It is not.
`plutil -lint` reports OK. Line 9 is a comment containing "--loop", and a double
hyphen inside an XML comment is illegal per spec — so Python's expat rejects it
while Apple's parser accepts it. The fault was my tool, not your file. Its
actual failure is the missing venv python, same as the rest.

A consolidation worth having: FOUR jobs depend on
~/Projects/youtube-ai-research/venv/bin/python, which is gone. So 30 failing
jobs are fewer than 30 distinct causes — restoring one virtualenv fixes four of
them.

Nothing repaired or unloaded — deleting a launchd job is destructive and these
are your operational jobs. Some may be intentionally
disabled, superseded, or carrying a stale code from a one-shot run. I traced one
chain to its root and did not trace the other 35.
