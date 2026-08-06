# Worklog: the items that passed the guards were worse than the ones that failed

A batch of 200 came back **123 OK, 77 failures** — and 76 of the 77 were
manuscript letters:

```
NO_TEXT:   William Cheyney Letter to son 1891-04-06
BAD_BODY:  William Cheyney Letter to son, Letter #2 1891-08-04
```

Handwriting has no usable OCR layer, so the guards were doing their job. The
wasted fetches were annoying but harmless.

## The worse half

**Thirteen of those letters passed** both guards and entered the corpus. Their
text:

```
be oe GEORGE BURNHAN, presinenr.  THE TOMBSTONE MILL AND MINING COMPANY,
Pivincelsne aerate  220 SOUTH FOURTH STREET,  ieledelbia,— LL At vow
```

`Dhiledilthi` for Philadelphia. OCR of handwriting, indistinguishable from noise.

**Why no gate caught them:** they score **0.541** and **0.547** on the
English-dictionary check — *above* the 0.45 threshold — because the printed
letterhead (`OFFICE`, `COMPANY`, `STREET`) carries them past it.
`corpus-integrity` does not catch these and never would have.

## The filter

`Letter(s) to/from … <year>` — requires a **year**, not merely the word "letter",
because **"Vegetable Growers' News Letter"** is a printed periodical that must
survive.

Validated against two real manifests:

| | |
| --- | ---: |
| correct skips | 87 |
| missed | 1 |
| apparent false positives | 13 |

## A reading I had to correct

I first read those 13 as *"real books the filter would discard"* and nearly
abandoned the whole idea — discarding 13 books to save 87 fetches is a bad trade.

Then I opened their text. They are the same Cheyney manuscripts. **The trade was
never 13 books against 87 fetches**; it was 100 manuscripts against nothing.

Checking *what* the items were, rather than *what the numbers implied*, is the
only thing that separated those two readings.

## Result

| | |
| --- | --- |
| want-list | 1,945 → **1,802** items |
| correspondence excluded | **121** |
| eligible | 692 → **572** |
| letter-titles surviving | **2**, both printed 18th-century pamphlets |

The survivors are right: *"A letter to Thomas Trotter : occasioned by his
proposal…"* is a published work, not correspondence.
