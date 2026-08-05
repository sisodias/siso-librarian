# Worklog: a refactor that passed every test and broke production

Date: 2026-08-05T07:41:58Z (generated filename)
Thread: the path conversion from last turn

## The bug I shipped

Converting `ia-ingest.mjs` to `lib/vault-paths.mjs`, I set
`VAULT = vaultRoot()` — the librarian-vault **root** — while all six joins
below still assumed the **ia-ingest** directory.

```
eligible 36 of 109 by rights; 0 already on vault; 36 to fetch
```

Those 36 books were sitting on disk. Re-running would have **re-downloaded all
of them from a volunteer-run archive**, and written manifests to the wrong
directory on the way.

## Why the fixture test missed it

The fixture supplies its own `VAULT_ROOT`, and the builder wrote and read
**consistently within it**. Self-consistency is not correctness. The bug only
appears against the real layout, where the ingest directory sits one level below
the root.

**A refactor that passes every test can still break production when the tests
supply their own environment.**

The other two converted scripts were fine — they explicitly join `ia-ingest/`
and `books-catalogue/` under the root, so `vaultRoot()` is correct for them.
Only the one that assumed the deeper path was wrong.

## Fixed and pinned

`VAULT = ingestDir()`, the helper built for exactly this. And a regression case
that runs the real ingester and reads its output:

```
reintroduced the bug on a copy:
FAIL  ingest resume sees books on the vault — reported '0 already on vault; 36 to fetch'
```

9 passed, 0 failed.

## Back to books

Fifth want-list: **1,100 candidates** from Natural history (838 available),
Astronomy (553) and Voyages and travels (140) — an order of magnitude larger
than any previous list, and squarely in the take-first tier.

The language filter caught **4** on titles alone, including Bacon's Latin *Sylva
sylvarvm*. The rights gate leaves **443 eligible**; fetching a bounded **120**
rather than asking a volunteer archive for 443 at once.

Verify exit 0.
