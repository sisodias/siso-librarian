# Worklog: the want-list was fetching photographs of houses

Another batch of 200 came back **123 OK, 77 NO_TEXT** — the same rate as the
correspondence batch, but **zero** of these were letters. The filter I had just
built did not apply.

```
NO_TEXT: 3733 Chevy Chase Drive, La Cañada Flintridge, California (front view)
NO_TEXT: 964 Foothill Boulevard, La Cañada Flintridge, California
NO_TEXT: People v. Gold Run (Part 49 of 52) - Order Extending time
```

Property photographs and court filings. The **Architecture** subject had pulled
in a photographic survey of La Cañada Flintridge.

## Scale, and the false-positive check

**91 of 579 eligible items (15%)** carry a street-address title; **365** across
the whole list.

Of those 365, **zero are books** — every one belongs to the same survey. The
pattern is anchored at the start and requires a leading house number *and* a
street-type word, so *"Roads and Bridges of Devon"* cannot match.

## The structural fix

A single **`isNotABook`** predicate combining correspondence and street-address,
imported by **both** the want-list builder and the index builder.

That shape is deliberate. One turn ago I added the correspondence rule to the
want-list builder, and then had to add it *separately* to the index builder,
because the two had no shared predicate — the filter came too late for 13 books
already fetched. **A new exclusion now reaches every call site by construction.**

## Result

| | |
| --- | --- |
| want-list | 1,840 → **1,552** items |
| excluded as not-a-book | **510** |
| street addresses remaining | **0** |
| fetch queue | 239 → **140** genuine books |

Probe extended **9 → 13 assertions**, and the new rule proven to fail on its own
defect: neutering the address pattern gives **23 passed, 1 failed**.
