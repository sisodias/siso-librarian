# Worklog: a gate that reported itself clean having examined zero files

Third pass of today's sweep for one shape: **a broken or absent input producing a
plausible answer.**

## Method, and why the grep was not enough

I counted self-emptiness guards per gate with grep. Two scored zero. Only **one**
was actually defective — so I starved each of its input and read what it did,
rather than trusting the count. A grep is a signal to investigate, never a
verdict.

## The defect

`audit-source-coverage`, run against a directory holding an empty `sources/`:

```json
{ "checked_files": 0,
  "sanity": "catalogue tables confirmed present",
  "findings": [] }
exit 0
```

Clean. Having read **nothing**.

The irony is sharp: this gate already emits a finding when one of *its own rules*
names a table that no longer exists — *"so it can no longer detect anything, fix
the rule, do not delete it"*. It applies that reasoning to the tables it checks
and **not to itself**. And the evidence was in its own output the whole time —
`checked_files: 0` prints on every run, and nothing ever acted on it.

## The fix

Emit `no-source-files-checked` when zero files are read, so `--strict` exits 6.

| case | exit |
| --- | ---: |
| empty `sources/` | **6** |
| real repo | **0** — 39 files |

## A gate that did NOT need fixing

`verify-claim-packets` exited 1 on empty input, which looked like a guard. It was
a **crash** — `ENOENT` on a missing schema file, before it ever reached the
claims. My test had proved nothing.

Retested with schema, portfolio and ledger present and `claims/` empty: it exits
1 having detected that all **10** portfolio-listed claim files are absent. A real
cross-check. Left alone.

Two gates looked identical to grep. One was blind, one was working.
