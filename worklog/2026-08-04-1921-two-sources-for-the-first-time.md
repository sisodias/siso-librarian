# Worklog: the catalogue spans two sources for the first time

Date: 2026-08-04T19:21:39Z (generated filename)
Thread: "catalogue ingest belongs behind a reviewed migration" — so I wrote one

## The schema told me not to INSERT, in its own comment

```sql
gid INTEGER PRIMARY KEY,   -- Gutenberg Text#, the stable id
rights TEXT NOT NULL,      -- never inferred
```

I could have argued about this. Instead I measured it:

| Fact | Value |
| --- | ---: |
| IA identifiers that are integers | **0 of 78** |
| gid matches the Gutenberg URL | 77,820 of 79,071 |
| rows joining on gid | **1,184,937** |
| distinct rights values in 79,071 rows | **1** (`public_domain_us`) |

`b2147171x` and `poetsofchristian00batt` are not integers and never will be.
Minting synthetic gids would put two id namespaces in one primary key that a
million rows depend on, and add rights strings the column has never held. That
is a schema change wearing an ingest's clothes.

## A sidecar instead

`book_external`, keyed by the **source-native id**. Additive only: it creates
one table and inserts into it, and never ALTERs or DELETEs. Provenance stays
exact — the IA identifier is the key, not a number I invented.

## Safety proven, not asserted

- **Tested on a scratch copy first.** All five existing tables unchanged,
  `quick_check` ok, before the real file was opened for writing.
- **The stale-backup guard was probed, not trusted.** I deleted one row from a
  scratch catalogue and ran the script against it: refused, exit **75**,
  `backup is stale — book live=79070 vault=79071`. It compares row counts
  across five tables, so a copy that merely *exists* does not pass.
- **The post-write check re-counts every existing table** and reports if any
  moved. Verifying the promise the script makes rather than assuming it.

## Result, read back from the live catalogue

| | |
| --- | ---: |
| `book` | 79,071 **unchanged** |
| `book_external` | **78** |
| words | **11,542,686** |
| existing tables changed | **0** |
| `quick_check(1)` | ok |

And the check that matters most — `text_path` **dereferences**:
`johndonnehisflig00molo` resolves to a real **570,497-byte** file on disk. A
catalogue row pointing at text that does not exist would be worse than no row.

**Every one of the 79,071 existing rows came from `project_gutenberg`.** This
is the first non-Gutenberg source the Library has ever held.

Verify exit 0.
