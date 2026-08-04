# Worklog: the want-list became books

Date: 2026-08-04T19:12:37Z (generated filename)
Thread: 81 identifiers, un-ingested since I built the list

## The gap was the obvious one

`build-want-list.mjs` produced 81 identifiers. **No script fetched any of
them.** The contract said it "takes named identifiers" and nothing consumed
them. I had built a list and called it a pipeline.

`scripts/ia-ingest.mjs`, now `npm run ia:ingest`. Rights gate admits 78 of
81; the 3 excluded carry the literal string "Public Domain License", which is
free text an uploader typed rather than a designation.

Text lands on the vault with a manifest. **Nothing was written to
`books.sqlite`** — catalogue ingest is a schema-bearing write to a database six
claims ground in, and belongs behind a reviewed migration, not a fetch loop.

## The bug my own guard caught

Three items returned **exactly 170 bytes**. My first instinct was to label them
missing text. Three identical short reads is one systematic cause, not three
coincidences — so I fetched one by hand:

```
content-length: 352362
```

The book was fine. `execFileSync` capturing a redirected download as a utf8
string truncated it. Fixed with `curl -o` to a temp file plus `--retry 3`,
rename on success. The same three then returned **341 KB, 551 KB and 172 KB**.

Without the `BAD_BODY` check they would have been written as three ingested
books of 170 bytes each, and the manifest would have said 5/5.

## A sample that would have misled me

`head -c 400` on the Donne text is pure OCR noise — it is the scanned cover and
endpapers. If I had judged quality from that prefix I would have thrown away a
good book. DjVuTXT files start with scan artefacts as a rule.

So quality was measured per-file over the **full** text, by stopword ratio:

| Measure | Value |
| --- | ---: |
| files | **69** |
| words | **9,333,163** |
| readable English (ratio ≥ 0.08) | **69 / 69** |

Range 0.106 to 0.299. The lowest is a Latin library catalogue, which is honest
rather than broken.

## Still running

The remaining fetches are in the background; the count above is a snapshot, not
a final total, and it is written as such.

Verify exit 0.
