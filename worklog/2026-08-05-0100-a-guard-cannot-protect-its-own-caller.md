# Worklog: a guard cannot protect its own caller

Date: 2026-08-05T01:00:04Z (generated filename)
Thread: the hole I found last turn and left open

## Confirmed first

Corrupt a claim on a scratch copy, then append `|| true` to the verify script:

```
intact chain      -> exit 1
with '|| true'    -> exit 0
```

**Two words in `package.json` make a corrupted repo report healthy.** Last
turn I measured this, wrote it down, and moved on. Naming a hole is not closing
one — the same mistake as *"size does. That remains open."*

## The guard

`audit-verify-chain.mjs` inspects the chain **definition** rather than the
artifacts. It catches `|| true`, `|| :`, a gate named but absent from disk,
and — the one that matters most — **a gate on disk but dropped from the chain**,
which still sits in `scripts/` looking like coverage.

Each of the four injected on a scratch copy produced exactly one finding of the
right kind.

## And my first fix did not work

I put the guard **first in the verify chain**. Then I ran the end-to-end test
rather than trusting that it fired in isolation:

```
broken repo + '|| true' -> exit 0     (unchanged)
```

`|| true` wraps the **whole** chain, including the guard. Standalone it exits
**4**; through npm it exits **0**.

**A guard cannot protect the mechanism that invokes it.** Obvious once stated,
and I would have shipped it as a fix if I had stopped at "the gate detects the
problem".

## The actual fix

A **pre-push hook**, calling the guard directly — outside the chain — before
running the chain.

```
compromised chain -> hook exit 1
intact chain      -> hook exit 0
```

**Caveat stated, not glossed:** `.git/hooks/` is not version-controlled, so
this protects *this clone only*. The script is committed as
`.githooks-pre-push` with `npm run hooks:install`; a fresh clone is
unprotected until someone runs it.

## A claim this confirms

GQ-001 says the gates *"have blocked ZERO pushes: verify runs by habit and stops
voluntarily, so it is a pre-commit convention rather than an enforcement
boundary."*

There were **no git hooks at all** until now. The claim was exactly right, and
this hook is the first thing in the repo that can actually stop a push.

| | |
| --- | --- |
| verify | exit 0 |
| gate self-test | 15 passed, 0 failed |
| load-bearing | **7 of 7** |
