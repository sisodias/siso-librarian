# Worklog: the page, and the archive that ate itself

Date: 2026-08-04T23:56:31Z (generated filename)
Thread: search the page could not do

## The page

`public/library.html` — **78 books, 11,260 chapter headings**, 470 KB,
searched in the browser. Linked from the observatory and verified by fetching
both over the tailnet, because an unlinked page is the same defect one level up.

Client-side deliberately: `public/` is served by a static file server under
launchd. There is no backend, and adding one means a process to keep alive, a
port, and a failure mode. Titles and headings ship; the 9.8M words of body text
stay in the database behind `npm run library:search`.

Search verified against the shipped data, not just that the page loads:

```
cookery -> 12   poetry -> 13   parliament -> 7   vegetarian -> 2
zxqwvblorptik -> 0
```

## Then the gates caught something that was not the page

`declared-derivation` findings jumped **0 → 5**. Not from the page — from **my
own retention work an hour earlier**.

`enforce-log-retention.sh` refreshes the slice from **live** before deleting.
On its second run the 136 rows were **already gone**, so the refresh rebuilt the
slice without them.

**A projection of a shrinking source is not an archive.**

| derivation | was | became |
| --- | ---: | ---: |
| CodexOpenAI raw_input | 45,285,517 | 45,264,719 |
| CodexOpenAI output | 109,467 | 108,841 |
| CodexOpenAI requests | 408 | 393 |
| out_per_1k_billed | 85.86 | 86.78 |

My safety mechanism destroyed the thing it was built to protect. What saved it
was an **unrelated** 5.75 GB full backup from 09:19 yesterday, which still held
every row — all four values restored **exactly**.

## The fix

The slice now **accumulates**: keep every row it has, add what live has that it
lacks, and **refuse and restore** if the count would shrink.

Proven by cutting the slice to 100 rows on purpose — the script recovered it to
3,586. It now holds **3,620 rows**, a superset of both live (3,465) and the
backup (2,261).

`free_pages` also went undeclared: it read 1,153,812, then 1,145,138, then
1,141,436 across three runs minutes apart. A sliding value cannot satisfy an
equality check.

| | |
| --- | ---: |
| verify | **exit 0** |
| derivations | **31**, 0 unavailable, 0 skipped |
| findings | 3, all `severity: info` |
