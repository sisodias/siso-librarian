# Worklog: the checksum that fits in seconds

Date: 2026-08-04T11:06:12Z (generated filename)
Thread: the full-table checksum I said I could not do

## Doing the thing I skipped

Last loop I recorded three single-row spot checks and noted plainly that a
`sum(chars),sum(words)` scan over 41.5M rows timed out at ten minutes. That was
honest, and it was also the wrong query.

A full scan reads every row. A **rowid range uses the primary key index**, so a
50,000-row band returns in seconds:

```
rowid 1        ..50001      MATCH   50001|30729422|5256317|7678557
rowid 10000000 ..10050000   MATCH   50001|35625951|5949092|7656632
rowid 20000000 ..20050000   MATCH   50001|29428121|4640818|7191033
rowid 30000000 ..30050000   MATCH   50001|32280156|5369596|7625691
rowid 41450000 ..41500000   MATCH   50001|31435354|5456691|7726539

bands matching: 5/5   rows compared: 250,005
```

Four independent aggregates per band — count, chars, words, preview bytes —
across the whole span of the index. **0.6% of the table**, and I am reporting it
as 0.6%: corruption confined to an unsampled band still passes. Materially
stronger than three rows, materially weaker than 41.5M.

## The guard that matters more than the checksum

Two empty strings compare equal. A vault that is mounted but unreadable would
have made every band "match" and reported a perfect backup.

So an empty result from either side is an explicit UNREADABLE failure, not a
match. Tested with a corrupt stand-in:

```
UNREADABLE (live='50001|32280156|...' vault='')
bands matching: 0/5   real exit=8
```

I nearly missed that it worked: my first check ran the script through `| tail`
and printed `exit=0`, because **a pipe reports the exit status of the last
command, not the script**. That is the same mistake that once let me push on a
red gate. Re-ran without the pipe to get the real 8.

## Deliberately not in `npm run verify`

Every query here touches USB. Yesterday one vault derivation turned a
58-second chain into one that never finished. `npm run vault:verify` is a
separate command, run when the backup matters.

## Two stale README claims, caught in passing

The file said *"Five decisions are blocked on Shaan"* — there are **seven** — and
*"runs all four checks"* when the chain now has five plus the rebuild. Both
fixed, and I checked the step count rather than assuming: `verify` has six
segments, one of which is `observatory:build`.

| Measurement | Before | After |
| --- | ---: | ---: |
| vault rows content-verified | 3 | **250,005** |
| aggregates compared per band | — | 4 |
| unreadable-vault detection | none | exit 8, proven |
| stale README claims | 2 | 0 |

Verify exit 0.

## What this still is not

A backup verified at 0.6% is a backup with a 99.4% unexamined remainder. The
honest framing is that five bands spanning first to last rowid make silent
wholesale corruption very unlikely and localised corruption entirely possible.
