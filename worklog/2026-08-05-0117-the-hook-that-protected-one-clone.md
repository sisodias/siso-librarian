# Worklog: the hook that protected one clone

Date: 2026-08-05T01:17:34Z (generated filename)
Thread: the caveat I stated and left standing

## The residual

Last turn I built a pre-push hook, then wrote: *"`.git/hooks/` isn't
version-controlled, so this protects **this clone only**."* True, stated
plainly — and left there. A fresh clone had the protection **in name only**, and
nothing would have told anyone.

That is the same defect I have now fixed four times in two days: a mechanism
that exists and is not reachable.

## Fixed

Moved to a tracked `.githooks/` directory with `core.hooksPath`. Verified
end to end against a **real bare remote**, not by calling the script by hand:

```
intact chain      -> push succeeds, exit 0
chain + '|| true' -> PUSH REFUSED: chain-swallows-failure, exit 1
```

That is **git** invoking the tracked hook.

## The part that is still per-clone — now detected

`core.hooksPath` is configuration, not content. A fresh clone gets the hook
**file** and no hook.

So `audit-verify-chain.mjs` now reports **`hooks-not-wired`** when
`core.hooksPath` is not `.githooks`:

```
this repo     -> 0 findings
fresh clone   -> hooks-not-wired  ("Fix: npm run hooks:install")
```

The residual cannot be removed — git will not run tracked hooks without being
told to. It **can** be made loud, and now is.

## A baseline my own change broke

`gates-are-load-bearing.sh` reported **BASELINE FAILED** straight after. The
scratch copy has no `core.hooksPath`, so the new check fired there — correctly.
The copy now wires hooks, matching real conditions.

Second time today a guard I added broke a test for a reason unrelated to what
that test measures. Worth watching: every new check has a blast radius.

| | |
| --- | --- |
| verify | exit 0 |
| gate self-test | 15 passed, 0 failed |
| retention self-test | 6 passed, 0 failed |
| load-bearing | 7 of 7 |
