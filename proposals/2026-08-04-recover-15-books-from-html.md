# Proposal: recover 15 books whose plain-text edition is empty upstream

Status: PROPOSED, not started. Needs a decision because it writes to the corpus.

## What is broken

15 books in the passage index have under 200 bytes of body because their
Gutenberg **plain-text** file contains a title, a licence and nothing else.

Measured, not inferred — the START and END markers in `pg4715.txt` are four
lines apart with 4 bytes between them.

Our extractor is not at fault. It consumed exactly what it was given, and the
850-book survey confirmed 850 of 850 local bodies byte-match their upstream
source.

## The works are not lost

The HTML editions carry the text:

```
gid     text body    html edition
4715      8 bytes    430,508 bytes
9320     75          163,258
2469    105           28,629
17421   187           28,433
17423   177           28,497
```

Five of five sampled. `An African Millionaire`, a full Grant Allen novel, is
present in HTML and absent in text.

## Why it is not already done

Ingesting HTML needs a parser this repo does not have. Writing one to recover 15
of 77,540 books is a real piece of work with a real failure mode: a bad parser
injects markup into the passage corpus, and the corpus is the Library.

The value is bounded (15 books). The risk is not bounded by anything except how
carefully the parser is written.

## What C6 actually says

*"Do not disturb `~/passages.sqlite` or the vault corpus **without copying
first**."*

The copy exists and answers — 77,540 book bodies, verified today by banded
checksum across 250,005 rows. **C6 permits this work.** I had been treating it
as a blanket prohibition, which is stricter than the constraint and is why this
sat for several loops labelled "not mine".

The honest blocker is the missing tooling, not the rule.

## The decision

1. **Recover them** — write an HTML-to-text path, validate on the 5 sampled
   books before touching the other 10, and re-run the trailing-gap check after.
2. **Leave them** — 15 of 77,540 is 0.02% of the corpus, and every one is
   findable from this file if it ever matters.

I lean to (2) at current disk pressure and (1) once the machine is not two days
from full. Either way the class is now measured and named rather than a single
book I kept deferring.
