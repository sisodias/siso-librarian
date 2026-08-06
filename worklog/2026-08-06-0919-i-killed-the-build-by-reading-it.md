# Worklog: I killed a 45-minute build by reading the database it was writing

Twice.

```
Runtime error near line 1: database is locked (5)
modern index failed
```

Testing the search CLI against the live corpus during a rebuild took read locks
at a commit point. The modern-index build died after **1,394,000 of 4,130,649**
rows. I re-ran it, tested search again, and killed it a second time at 112,000.

## The underlying fragility

**Not one script in the pipeline had a busy timeout.**

```
build-external-passages   unprotected
migrate-book-external     unprotected
build-library-page        unprotected
corpus-integrity          unprotected
add-longs-variants        unprotected
```

Every one failed instantly on any lock contention. My testing was the trigger,
but the fragility is the finding: **a corpus that cannot be read while it
rebuilds has ~45 minutes of downtime per ingest cycle** — and I had just built a
web search endpoint that reads it.

## The fix

Writers get `.timeout 60000`; readers get `.timeout 5000`. The asymmetry is the
point: **a reader retries a query, a writer would have to redo forty-five
minutes.**

Verified by running a reader *during* a write: reader **exit 0**, writer **still
alive**. That is the exact failure mode, no longer failing.

## The guard I already had did not cover this

I added `refuse_if_ingesting` earlier today, after a concurrent *ingest* killed a
rebuild. It blocks a rebuild while an ingest runs — and says nothing about
**readers**, which were the problem this time. A guard written for one direction
of a concurrency bug does not protect the other.

## Corpus

**2,812 books, 4,130,649 passages, 338.1M words.**

Catalogue 2,812 against index 2,810: both missing books are OCR noise, matching
`corpus_stats.skipped_no_paragraphs` exactly.

**854,750 passages contain long-s**, across **8,103** distinct converted words —
the recall the modern index exists to provide.

| query | at 4.1M passages |
| --- | ---: |
| telescope | 5,721ms |
| such | 730ms |
| himfelf | 417ms |
