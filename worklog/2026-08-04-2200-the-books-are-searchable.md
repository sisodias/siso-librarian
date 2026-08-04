# Worklog: the 78 books are searchable

Date: 2026-08-04T22:00:11Z (generated filename)
Thread: three turns of infrastructure, and the mission is books

## The objection I had over-extended

I wrote that the 78 IA books "stay unindexed" because indexing needs the
synthetic-gid decision I refused. Then I read the schema:

```sql
CREATE VIRTUAL TABLE passage_search USING fts5(gid UNINDEXED, ...)
```

**UNINDEXED** means FTS5 stores the column as an opaque passthrough — never
compared, joined, or ordered on. A TEXT identifier works exactly as well.

"Cannot join on gid" was never the same as "cannot be searched". The constraint
was real; I carried it past its scope.

## Result

```
books      78
passages   122,553
words      9,826,621     (85% of the 11.54M corpus)
index      150.3 MB, separate file
```

Search verified in both directions: **"metaphysical AND poets"** returns real
snippets from *Images of Eternity* joined to catalogue titles;
**"zxqwvblorptik"** returns **0**. An index that matches everything would pass
the first test too.

## Three wrong diagnoses, in order

**One.** Multi-column OCR shreds paragraphs; hyphen-rejoin fixes it. A Python
test on one book showed **3,679 → 283,492 words, 77×**. Applied it — the corpus
moved 1.66M → 1.85M and that book barely improved. *I inferred a corpus-wide
cause from a single file and reported the isolated number as though it were the
fix.*

**Two.** My Python mirror must differ from the JS segmenter. Aligned them:
output **identical**, 26,542 passages either way. Second guess, also wrong — and
the patch landing cleanly proved nothing, because `applyEdit` verifies the
*edit*, not the *theory*.

**Three.** Stop guessing; measure which filter cuts. The alpha-ratio filter was
rejecting **3,208 of 3,334** long blocks — good prose whose only sin is that
this OCR puts **double spaces between every word**, dragging letters/total to
0.65–0.68 against a 0.7 threshold. Whitespace is not evidence of scan noise.

Ratio over non-space characters: **1.85M → 9.83M words**, 26,542 → **122,553**
passages.

## What it cost

Two guesses, two full rebuilds. The third attempt measured first and found it in
one step. The tell was there the whole time — bimodal retention, ~88% on some
books and under 2% on others, is a *format* difference, and I should have gone
looking for which filter was responsible before theorising about causes.

All three edits went through `applyEdit` with post-conditions — the first real
use of the helper I built two turns ago and had never once used.

Verify exit 0. Gate self-test: 15 passed, 0 failed.
