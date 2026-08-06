# Worklog: a 128-second regression that did not exist

After the rebuild to 4.65M passages I checked search and got:

```
quinine     45,074ms
such        42,362ms
himself    127,788ms
```

"himself" was **798ms** an hour earlier. That reads as a sharp non-linear
collapse at scale, and I started hunting it.

## How I disproved my own finding

- **printed-only 371ms, modern-only 457ms** — each half fast, so I blamed the
  exclusion that only runs when both are queried
- **the exclusion alone: 145ms**
- **the script's exact modern query: 412ms**; its exact printed query: **328ms**

Every component was fast. When the parts are all quick and the whole is slow,
the problem is usually not the code — so I re-ran the CLI itself:

```
run 1: 781ms
run 2: 783ms
```

**No regression.** The observatory build was still reading the database when I
took the first timings. Contention, not the query.

## A second false alarm inside the same check

```
telescope  17,894ms  ->  313 / 136 / 133ms
himfelf    25,454ms  ->  579 / 210 / 209ms
```

Cold cache. The vault is a USB volume, so the first touch after a full rebuild
pays disk cost that has nothing to do with the query plan.

## Warm-state truth at 4,652,447 passages

| query | time |
| --- | ---: |
| telescope | 137ms |
| quinine | 188ms |
| himfelf | 211ms |
| such | 696ms |
| the | 729ms |
| himself | 789ms |
| botany | 2,394ms |

## The lesson

I took three measurements while a writer held the database and nearly recorded a
defect that does not exist — the same class as yesterday's "stale server
process" 500, and the day before's `npm run verify` that measured the wrong
chain.

**A timing taken during contention is not a timing.** Every number above is from
a warmed, uncontended repeat.

## Corpus

**3,272 books catalogued, 3,270 indexed** (2 OCR-noise skips, correctly
accounted for), **4,652,447 passages, 385.4M words.**
