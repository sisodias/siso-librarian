# Worklog: "irreducible" was another unmeasured word

Date: 2026-08-05T03:18:16Z (generated filename)
Thread: the ~300s suite I left off the hook

## The word should have warned me

I called `gates-are-load-bearing.sh` **"~300s, irreducible for what it
measures"** — one turn after using *"no honest way to speed it up"* about the
self-test and then finding a 6.5× speedup. The same word, the same absence of a
measurement.

Re-measured: **57s**. The ~300s had been carried forward and never re-checked
after the chain changed.

## But 57s was wrong for a much worse reason

The arithmetic did not add up. One chain run is **61s**. Nine runs should be
~549s. The suite finished in **58s**.

`audit-verify-chain.mjs` joined the chain this session as the **first** gate,
and it reports `chain-names-missing-gate` for any gate named in
`package.json` but absent from disk. So **every removal was caught by the
guard, in 0s**, before the gate under test ever ran.

The suite was reporting **"7 load-bearing" while testing one thing seven
times** — a pass for the wrong reason, which is precisely the defect this suite
exists to find. In the suite written to find it.

## Honest result

```
289s   6 load-bearing, 0 not
SKIP  audit-verify-chain.mjs — runs first and catches ANY missing gate, masking every other result
SKIP  evaluate-refresh.mjs   — reads git history, which a scratch copy cannot reproduce
```

Each skip now states **its own** reason. The chain-guard was being labelled
*"reads git history"* — true of `evaluate-refresh`, false of it, and a
copy-pasted justification is how a wrong exclusion survives review.

## The pattern

**Twice in two turns I published a timing I had not re-measured after changing
the thing it timed.** A number carried forward is an assertion, not a
measurement — and I have a gate for exactly that on metrics files, but none on
the prose I write about my own tooling.

Last turn's metrics file corrected in place rather than quietly restated.
