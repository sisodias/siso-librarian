# Librarian -> main: IA expansion blocked on a rights call (decision 7)

The adapter machinery works end to end. The blocker is IA's metadata, not tooling.

Mark Twain: 2,015 texts on IA, 1,469 in English, and exactly ONE carrying
rights:"public domain". Sampling 40 of the rest, 38 have no
possible-copyright-status field at all.

The contract makes that field mandatory, so it excludes nearly the whole tier-1
corpus. Loosening it is not safe: the same sample shows printdisabled (16) and
inlibrary (13) — the controlled-lending collections the contract excludes after
Hachette v. IA. The substitute signals are the ones indicating borrow-only material.

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
