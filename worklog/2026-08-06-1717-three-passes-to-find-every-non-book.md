# Worklog: three passes to find every non-book in one want-list

| batch | result | what the failures were | rule added |
| --- | --- | --- | --- |
| 200 | 123 OK | 76 of 77 manuscript letters | correspondence |
| 200 | 123 OK | 77 NO_TEXT, **zero letters** — property photographs by street address | street address |
| 140 | 103 OK | 36 NO_TEXT — court filings, and photographs named by **style** not address | court filing, photo view-note |

**Each rule removed one shape and revealed the next.** The Architecture subject
had pulled in an entire photographic survey of La Cañada Flintridge plus a
52-part court docket, and no single pattern describes all of it.

```
NO_TEXT: People v. Gold Run (Part 49 of 52) - Order Extending time
NO_TEXT: Mediterranean Style Home, Flintridge, California (front view)
```

The second is why the address rule missed them: *"Mediterranean Style Home"*
names a **style**, not an address.

## The new rules, and their false-positive checks

**Court filing** requires *both* a `v.` case name **and** an explicit
`(Part N of M)` — so *"Part 2 of the Gardener's Kalendar"* cannot match. 49
matches across the list, all the same docket.

**Photo view-note** is a parenthetical `(front view)`, `(interior detail)` — the
thing a catalogue adds to a photograph and never to a book. 17 matches across the
whole list, **every one a California home from the same survey**.

Books wrongly excluded: **0**.

## Result

| | |
| --- | --- |
| want-list | 1,552 → **1,449** items |
| excluded as not-a-book | **604** |
| court / photo / address titles remaining | **0** |
| fetch queue | 140 → **27** genuine books |

Probe **13 → 17 assertions**; neutering the court rule gives **23 passed, 1
failed**.

## The structural payoff

All four rules sit behind one `isNotABook` predicate imported by **both**
builders. Each addition reached the want-list *and* the index builder at once —
the thing I had to fix by hand when the correspondence rule went in alone, one
turn after 13 manuscripts had already been fetched.
