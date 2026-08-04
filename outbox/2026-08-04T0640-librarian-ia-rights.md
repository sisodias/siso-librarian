# Librarian -> main: IA expansion blocked on a rights call (decision 7)

The adapter machinery works end to end. The blocker is IA's metadata, not tooling.

Mark Twain: 2,015 texts on IA, 1,469 in English, and exactly ONE carrying
rights:"public domain". Sampling 40 of the rest, 38 have no
possible-copyright-status field at all.

The contract makes that field mandatory, so it excludes nearly the whole tier-1
corpus. Loosening it is not safe: the same sample shows printdisabled (16) and
inlibrary (13) — the controlled-lending collections the contract excludes after
Hachette v. IA. The substitute signals are the ones indicating borrow-only material.

SCOPE CORRECTION (added later the same day). What follows is true of the
SPARSE-METADATA subset only. I re-measured the pool that carries an explicit
rights field:

  270,049 English texts with rights:"public domain", excluding borrow-only
  (270,046 this morning — the pool is live and growing)

Every one of those has a rights determination ALREADY MADE by the Internet
Archive. Ingesting them needs no judgement from me. So IA expansion is not
blocked on a copyright call; only the Twain-style sparse-metadata cases are.

What IS open is selection, not rights: the head of that 270k pool is ephemera —
student newspapers, sales catalogues, family photographs — and choosing which
the Library wants is a curation decision, not a legal one.

AND THE LIBRARY ALREADY ANSWERS IT. I said "curation decision" and stopped. But
books.sqlite records subjects for all 77,540 books, so what this Library
collects is measurable:

  Science fiction 3,291   Short stories 3,218   Fiction 1,959
  Adventure 1,642   Historical fiction 1,080   Detective 1,013

Applying those subjects to the explicit-rights IA pool:

  Science fiction                535
  Short stories                  455
  Detective and mystery stories  128
  Adventure stories               88
  Historical fiction              58
                               -----
                               1,264

RETRACTED, one hour later. I then built the title dedup and ran it.

  40 titles sampled from that science-fiction pool
  39 ALREADY IN THE LIBRARY  —  97.5% overlap

Including the three I quoted as evidence the filter worked: "Vulcan's Workshop"
is gid 29321, "Wanderer of Infinity" is 29408, "Planet of Dreams" is 30045. I
had the dedup half-written and did not run it against my own examples.

The matching gids cluster at 29,000-30,000, so both corpora appear to come from
the same Gutenberg science-fiction ingest. The IA pool largely MIRRORS what is
already here.

So the honest number is roughly 30 new books, not 1,264. The 99.5% reduction
from 270k was real; the assumption that what survived was NEW was never tested,
and it was wrong.

I then checked whether that was a science-fiction artifact. It is not:

  subject                        library books   sample   held    overlap
  Science fiction                        3,291       40      39     97.5%
  Detective and mystery stories          1,013       30      29     96.7%
  Historical fiction                     1,080       30      28     93.3%
  Cookery                                  384       20      13     65.0%

OVERLAP TRACKS LIBRARY STRENGTH, not IA content. Where this Library holds
thousands, IA offers almost nothing new. Where it holds hundreds, a third of the
sample is new. Both corpora draw heavily on Gutenberg, so they converge exactly
where Gutenberg is deep.

Which means my subject filter was aimed at the Library's TOP subjects —
precisely where it yields least. Aiming at weak subjects inverts that, but the
pools there are small (IA has 60 cookery texts total).

Then I tested the inversion instead of leaving it as a remark:

  subject              library   IA pool   new%   est. new
  Science fiction        3,291       535    2.5         13
  Detective              1,013       128    3.3          4
  Historical fiction     1,080        58    6.7          4
  Cookery                  384        60   35.0         21
  Essays                   243        77   33.3         26
  English poetry           232        92   40.0         37
                                                      ----
                                                       105

English poetry yields 40% new against science fiction's 2.5% — a 16x difference,
driven entirely by what this Library already holds. The three WEAK subjects
contribute 84 of the 105 despite pools an order of magnitude smaller.

I then replaced the estimates with a CENSUS. Five of the six pools are small
enough to check in full, one query each, no sampling error:

  subject                        pool   checked   NEW    was estimated
  English poetry                   92        92    38              37
  Essays                           77        77    37              26
  Cookery                          60        60    30              21
  Detective and mystery stories   128       128    14               4
  Historical fiction               58        58     5               4
                                                  ---
                                                  124

  Science fiction                 535       462     4               13

128 NEW BOOKS COUNTED. All six subjects, nothing estimated.

Science fiction needed pagination (200 rows/page, 3 pages) rather than one
query. Its 40-title sample had OVERSTATED it by 3x — 2.5% sampled against 0.9%
actual. So small samples were noisy in BOTH directions, not systematically
pessimistic as I said last loop.

One more thing worth knowing: 535 search results collapsed to 462 unique titles.
IA's reported pool size is not the number of distinct works — there are 73
duplicates inside IA itself.

The samples had understated every weak subject — Detective went 4 to 14, Essays
26 to 37. Small samples on small pools were noisy in the pessimistic direction,
which is worth knowing before trusting any of my other 20-40 title samples.

I checked the 95% interval on the sampled version before doing this: 42-186
around a point estimate of 105. That range is why the census was worth an extra
five queries.

The method is counter-intuitive and worth stating plainly: aim at what the
Library is WEAK in. You would normally deepen a strength, but the goal here is
books we do not have, and strength is exactly where we already have them.

That is a THIRD option for decision 7, alongside "someone supplies identifiers"
and "sample relevance after fetch". I have not built it — the want-list contract
takes named identifiers and this produces a query, so wiring them together is a
real adapter change, and the dedup question should be settled first now that
77,534 books turn out to have titles.

The original text follows, and it stands for the sparse cases.

This is a copyright determination, not a query problem. A 1900 Twain edition is
almost certainly public domain despite absent metadata, and that is still not a
call I should make for you.

CORRECTION (added before this message was ever delivered). I first wrote that
the rights-clean pool was "dozens, not thousands". That was wrong, and it was
wrong in an instructive way: I estimated it from three author queries. Twain has
2,015 IA texts and exactly 1 with rights:"public domain", and I generalised that
1-in-2,015 ratio to the whole archive. The rights field is not sparse uniformly —
it is populated on institutional scans and absent on the famous-author material I
happened to probe. Measured properly:

    270,065  english public-domain texts
    270,046  ... excluding printdisabled / inlibrary (borrow-only)
    119,200  ... and in americana (published works)
     37,299  americana + pre-1930

So volume is not the constraint — selection within the pool is. The head of every
slice is ephemera: student newspapers, Sotheby's sales catalogues, family letters,
photographs. That kills the publication-year heuristic I offered as option two,
since it would add volume to a pool that already has plenty.

Two options remain live:
  1. You (or someone) supply a curated identifier list. The contract already
     enforces named-want-list-only, so this needs no code change.
  2. Full-text relevance sampling AFTER fetch. This inverts the contract's
     check-before-download design, so I am not doing it without your view.

The underlying copyright question is unchanged and still yours: a 1900 Twain
edition is almost certainly public domain despite absent metadata, and that is
not a call I should make for you.

Evidence: metrics/2026-08-04-ia-rights-sparsity.json
          metrics/2026-08-04-ia-corpus-sizing.json
