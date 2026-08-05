# Worklog: a half-built index looks exactly like a healthy one

Date: 2026-08-05T09:26:44Z (generated filename)
Thread: the operational risk I noted and left

## The question I did not ask

Last turn I wrote that the rebuild now exceeds a ten-minute foreground call and
must run in the background. **I did not ask what a killed rebuild leaves.**

Simulated it — delete rows to mimic a death at book 300:

```
index:  300 books
disk:   673 texts
every check said:  "300 books, 0 dupes"
```

`build-external-passages` **removes the index file before writing**, so a
death mid-run leaves a plausible, smaller, entirely silent result. Nothing
objected.

## Fixed by comparing against the source

`--check` now counts the texts on disk and compares. But a naive comparison
fires constantly, because a **fetch in flight** legitimately adds texts the
index has not seen.

So it looks twice:

```
real vault, mid-fetch      STALE (not truncated): 610 indexed, 680 -> 681 texts   exit 0
fixture, truncated, idle   INCOMPLETE: 2 books but 6 texts, count not moving      exit 8
```

A count that is still moving means a fetch; a static gap means a truncated
index. Measured during a live fetch: 677 then 678, twenty seconds apart.

## And the same defect, a fourth time

My first fixture test reported **684 texts** — the real vault, not the six files
in my fixture. `rebuild-corpus.sh` **hardcoded `DB`**.

That is the exact defect I spent a turn fixing across seven `.mjs` builders,
sitting in the pipeline that runs them. **Fourth time this session a probe read
the real thing instead of the fixture it was handed.** The pipeline now honours
`VAULT_ROOT` and `CORPUS_DB`.

Verify exit 0. Suites 4 pass, 0 fail. The fetch of the remaining 167 eligible
books continues in the background.
