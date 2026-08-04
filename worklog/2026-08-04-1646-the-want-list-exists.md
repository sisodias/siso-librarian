# Worklog: the want-list exists

Date: 2026-08-04T16:46:21Z (generated filename)
Thread: closing the gap I kept naming

## Built

```
npm run ia:want-list -- --write "English poetry" "Essays" "Cookery" ...

  English poetry                  92 fetched, 30 new
  Essays                          77 fetched, 31 new
  Cookery                         60 fetched, 26 new
  Detective and mystery stories  128 fetched, 14 new
  Historical fiction              58 fetched,  5 new
                                             ----
  106 candidate identifiers
```

All seven contract fields present, 106 unique identifiers, written to
`sources/internet-archive/want-list-weak-subjects.json`.

Four loops I said *"the want-list contract takes named identifiers and this
produces a query, so wiring them is a real adapter change"* and did not do it.
It was one script.

## 106, not 124 — and the census was wrong

```
cookery: 60 results, 56 unique titles
```

**The census deduped against the Library but not against itself.** Four cookery
results were the same works. The generator dedupes both ways plus cross-subject,
since a book can carry several subjects.

So my counted 124 overcounted by ~18. **106 is the number of distinct fetchable
works.**

## Which corrects last loop, again

I wrote that only science fiction had duplicates, five of six pools at zero.
Cookery has four.

My check compared `numFound` to unique titles **in the sample I had fetched**.
For five subjects that sample was the whole pool — so the comparison was valid —
but I stated "0 duplicates" as a property of the pool rather than of my
comparison, and cookery's duplicates only surfaced when the generator deduped
differently.

**Fourth over-generalisation this session, same shape.** Caught by building on
it, which is the only reason it surfaced.

## A rights flag I did not resolve

```
items dated post-1929   7
latest year             2025
items with no year      25
```

All carry IA's explicit `rights:"public domain"` field — the contract's evidence.
A 1947 or 1959 imprint is exactly where that field deserves scrutiny.

**Flagged in the file, not removed.** Removing them would be the copyright
judgement I have consistently declined to make. A reviewer now checks seven
items instead of 106.

| Measurement | Value |
| --- | ---: |
| candidate identifiers | **106** |
| contract fields present | 7 of 7 |
| census overcount corrected | ~18 |
| rights outliers flagged | 7 |

Verify exit 0.

## Not ingested

This produces a want-list. Fetching and ingesting is the adapter's job and a
separate decision — but the thing that did not exist an hour ago now does, and
it took one script rather than the "real adapter change" I kept describing.
