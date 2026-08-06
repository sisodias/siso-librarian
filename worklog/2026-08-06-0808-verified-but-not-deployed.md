# Worklog: the endpoint I verified did not exist in the running service

I tested `/search` on a scratch port, got six correct responses, wrote the
worklog, and pushed. Then I checked the **live** service:

```
/search HTTP 404
```

The running process predated my edit. **A verified endpoint that is not deployed
is not a feature** — I had proved the code worked and left the reader with
nothing, which is the same defect the endpoint was written to fix.

## What restarting it revealed

There are **two** servers, not one:

```
com.siso.librarian-observatory   python3 -m http.server   :8845
com.siso.observatory             serve-observatory.mjs    :8765
```

Both serve `public/`. I had inspected the Python one's plist while editing the
Node one.

## Three wrong diagnoses before the right one

**"launchd's cwd is wrong."** No — `WorkingDirectory` is set correctly.

**"bare `node` is not on launchd's PATH."** True (`env -i sh -c 'command -v
node'` finds nothing) but **not the cause**: the CLI runs fine with no PATH at
all. Fixed anyway with `process.execPath`, which is right regardless.

**"the rebuild holds a write lock."** Partly true — the CLI *was* dying at its
startup schema check during the modern-index build. Fixed with `.timeout 5000`
and verified working **during** the rebuild in 2s. Still not the endpoint
failure.

## The actual cause

```
unable to open database "…/external-passages.sqlite?mode=ro": authorization denied
```

Not permissions: the file is `-rw-r--r--`, owned by the same user, and reads fine
from a terminal. **macOS TCC withholds removable-volume access from processes
launchd starts.** The fix is Full Disk Access in System Settings — a GUI action,
and Shaan's to take, not mine.

## What I did instead

The endpoint now answers **503** with the diagnosis *and* the remedy:

```json
{ "error": "the corpus index is not readable by this service",
  "why":   "macOS withholds removable-volume access from launchd-started processes (TCC)…",
  "fix":   "System Settings > Privacy & Security > Full Disk Access, add the node binary…" }
```

A permission wall that reads as "search is broken" is the kind of thing nobody
ever fixes, because nobody knows what to fix.

## Verified

| | |
| --- | --- |
| live endpoint | **503** naming TCC and the fix |
| CLI during a rebuild | **2s**, real results |
| static pages | unaffected |
