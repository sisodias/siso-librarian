# Worklog: six books that are not English

Date: 2026-08-05T05:59:06Z (generated filename)
Thread: reading the 220 books I added today

## Structure verified, content never

I checked headings, retention and duplicates at 298 books. **Nobody had read
any of it.** An unread book is inventory.

The new tier is real: a 17th-century *Practice of Physick* (8,867 passages),
Stanley's *History of Philosophy*, *The medical and surgical history of the War
of the Rebellion*, *The medical annals of Maryland 1799–1899*.

## The finding

Dictionary-hit rate per book, over 300-character previews:

```
median                82.2%
every English book    above 45%
six books             18-21%
```

Reading them: **five German, one Latin.** *Janus: Central-Magazin für Geschichte
… der Medicin* and Freind's *Historia medicinae*.

The want-list filters IA on `language:eng`. **IA's metadata is wrong for these
six** — and this is not OCR damage, because long-s books score fine; the
dictionary still matches most of their words.

## Reported, not fatal

A German medical-history journal is a legitimate book that the **selection** let
in. Whether the Library wants non-English material is not a decision this gate
should make, so `corpus-integrity` reports it and does not fail on it.

## Two mistakes of mine

**I looked for "the newest books" with `rowid desc`** and got London Magazine
volumes from the *first* want-list — the migration rewrites rows, so rowid order
is not insertion order. Selected by want-list identifier instead: all 119
present.

**My first test of the new check injected a fake German book with 5 passages and
it was not detected.** The check requires 200+ words before scoring — deliberately,
so short books do not produce noise. With 40 passages it detects at **0.171**,
suspects 6 → 7. **The check was right and my test was undersized.**

Verify exit 0.
