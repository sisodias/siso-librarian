# Worklog: one of two thousand and fifteen

Date: 2026-08-04T06:41:09Z (generated filename)
Thread: charter gap 2 — sources beyond Gutenberg

## Reading the Library's own definition

I said last loop that gap 2 needed "a curated identifier list from someone who knows what belongs." The Library already encodes that — `tier_queries.sql` — so I read it instead of inventing more queries.

It uses **the same subject patterns I had used**: `%essays%`, `%letters%`, `%speech%`, `%correspondence%`. My queries matched the definition exactly.

The difference is what they run against. The Library applies those patterns to **Gutenberg's LoC-derived subjects**, which are curated cataloguing. IA's are user-supplied folksonomy. Identical patterns, incomparable inputs — which is precisely why mine returned "Letter to Alice from Uncle Fred."

## Switching axis: query by author

So I queried IA for authors the Library already validates as tier-1 — Twain (204 works), Howells (122), Stevenson (123).

```
Mark Twain              1
William Dean Howells    0
Robert Louis Stevenson  0
```

One result, for three of the most published authors in English.

## Why, and it is not the author names

```
Mark Twain, mediatype:texts                        2,015
  + language:eng                                   1,469
  + rights:"public domain"                             1
```

**One of 2,015.** Not because the other 2,014 are in copyright — because IA's rights field is rarely populated. Sampling 40: **38 have no `possible-copyright-status` at all.**

The contract makes that field mandatory. It therefore excludes essentially the entire tier-1 corpus, and no amount of query craft changes that.

## The trap in loosening it

The obvious response is to relax the rights filter and use another signal. The same 40-item sample says why not:

```
internetarchivebooks  35
printdisabled         16
inlibrary             13
```

`printdisabled` and `inlibrary` are the **controlled-digital-lending collections the contract excludes explicitly after Hachette v. IA**. The signals available as substitutes are exactly the ones marking borrow-only material.

That reframes the rights filter. I had been treating it as conservative gatekeeping costing me volume. It is the thing keeping ingestion legal, and its sparsity is a property of IA's cataloguing, not a flaw in the contract.

## Filed rather than solved

Decision 7. A 1900 Twain edition is almost certainly public domain despite absent metadata — and asserting that is a **copyright determination**, not a query fix. It is not mine to make on someone else's behalf, however confident I am.

Three options offered, cheapest first: accept a small high-confidence corpus; publication-year plus author-death-date as a documented heuristic; or source from HathiTrust/Google Books where rights metadata is denser.

| Measurement | Value |
| --- | ---: |
| Twain texts on IA | 2,015 |
| in English | 1,469 |
| with `rights:"public domain"` | **1** |
| sampled items lacking copyright status | 38 / 40 |
| decisions awaiting Shaan | **7** |

## Residual

Two messages now queued in the outbox — the disk warning and this. Link still down; `mailbox-flush` reports it correctly as not-an-error and they will go when it returns.

Gap 2 is no longer "I lack a query." It is a documented, evidenced blocker with options attached, which is the most useful state I can leave it in without making a legal call.
