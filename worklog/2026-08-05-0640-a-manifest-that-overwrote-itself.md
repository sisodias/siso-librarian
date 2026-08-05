# Worklog: a manifest that overwrote itself

Date: 2026-08-05T06:40:06Z (generated filename)
Thread: the fourth want-list

## The filter worked on its first live run

The language check I moved to selection last turn caught **Anselm's *Tractatus
de praedestinatione et de praescientia Dei*** — Latin, excluded before a byte
was downloaded. That is what moving a report to a filter buys.

## Then the index and the catalogue disagreed

**334 books indexed, 300 catalogued.** Thirty-four books present in the passage
index and absent from the Library's own record.

The manifest filename used `slice(0, 15)` — **minute precision**. A fetch and
its retry landed in the same minute, and the retry **overwrote** the first
manifest. The text files survived; the record of where they came from did not.

**Nothing errored.** The migration reads manifests, so those 34 simply never
appeared. A losing write that reports success is the worst shape of defect here.

Fixed to second precision with a refusal to overwrite an existing path, and the
34 entries reconstructed from the text files and want-list — labelled
`RECONSTRUCTED`, not passed off as original.

## Then shared passages jumped 3 → 324

Investigated rather than accepted: **339 of them are one pair.**

```
Medical logic                          1,151 passages
Medical logic [electronic resource]    1,143 passages
```

The same book scanned twice. `[electronic resource]` **survived
normalisation**, so the dedup never saw them as the same title. IA appends that
suffix constantly — the title index dropped **75,008 → 74,965** once I stripped
brackets, so **43 duplicate title-forms** were getting through, not one unlucky
pair.

Everything else in the 324 is 1–3 passages of ordinary quotation, unchanged from
298 books.

## And a build ordering nothing enforced

`build-library-page` failed: *"no such table: passage_modern"*. Rebuilding the
passage index **drops and recreates the database**, destroying the
modern-spelling table. `add-longs-variants` must run between them, and nothing
said so.

## Where it landed

| | |
| --- | ---: |
| books | **334** |
| passages | **359,590** |
| indexed words | **31.3M** |
| exact duplicates | 0 |

Rights gate consistency, checked across every ingest: **204 formal-designation,
94 institutional-review, 0 bare-assertion ever admitted.** This list excluded 69
of 109 on a bare "Public Domain" string — the same rule, not a new stricture.

Verify exit 0. Suites 3 pass, 0 fail.
