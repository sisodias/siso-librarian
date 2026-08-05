# Worklog: the rebuild order existed only in my head

Date: 2026-08-05T06:52:30Z (generated filename)
Thread: last turn's third defect

## A worklog is not a mechanism

`build-library-page` failed with *"no such table: passage_modern"* because
rebuilding the passage index **drops and recreates the database**.
`add-longs-variants` has to run between them.

I wrote that down in a worklog and moved on. **The next rebuild would have
broken the same way.**

Measured: I have run this sequence **five times and got it wrong once**. A 20%
failure rate on a procedure with no enforcement.

## The pipeline

`npm run corpus:rebuild` — five steps in dependency order, each verifying the
one before produced what the next needs:

```
1  catalogue          reads manifests
2  passage index      DROPS and recreates the database
3  modern spelling    MUST follow 2 — 2 destroys it
4  library page       needs BOTH indexes
5  integrity
```

Guards: an index holding no books exits 1, `passage_modern` absent after its
own build exits 1, and **catalogue ≠ index exits 9**.

That last one matters most. The catalogue and index **disagreed by 34 books**
last turn and nothing noticed until I compared them by hand. Now every run ends:

```
catalogue and index agree: 334 books
```

## A test of mine that proved nothing

I set `CORPUS_DB` to a copy with `passage_modern` dropped, expected exit 1,
and got **exit 0**. `build-library-page.mjs` reads a **hardcoded** path and
ignores `CORPUS_DB` — it had tested the real database, which was fine.

Renaming the table on the real database and restoring it after gave the honest
answer: **exit 1, then exit 0.**

**Third time this session a probe measured my fixture instead of the thing.**

## Also

`corpus-integrity` carried a note reading *"across 179 books"* long after the
corpus reached 334 — corrected, and it now names the duplicate-versus-quotation
distinction the 339-passage pair taught.

Verify exit 0. Suites 3 pass, 0 fail.
