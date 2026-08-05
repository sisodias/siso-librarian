# Worklog: the one gate in the chain that could not enforce

Noticed because `audit-asserted-numbers` exited **3** standalone but the chain
passed. The chain was the only place it ran **without `--strict`** — ten gates
enforcing, one advisory.

## Why it had been left that way

`--strict` gated on **all** findings, including 23 immovable historical ones. So
it could never be added without blocking every push. The script's own comment
already claimed otherwise:

> Advisory by default … **`--strict` makes it a gate for new work.**

The code never implemented that. The intent was written down and the mechanism
was missing.

## The debt is real, and bounded

Every drift finding is dated **2026-08-03 or 2026-08-04**. The damning detail:
**17 of 23 assert a time *before* the commit that added them** — up to **261
minutes**. "Named early, committed later" explains positive drift; it cannot
explain a filename claiming 09:35 on a file committed at 04:10. Those were
hand-typed.

The practice is already fixed. **44 worklogs written 2026-08-05 with `date -u`:
zero drift findings.** So a dated cutoff is a fact about a changed practice, not
an amnesty — and the historical findings stay visible and counted in the report.

`severity: info` never gates either: `snapshot-undeclared-numbers` reports "12 of
51 published numbers carry no derivation declaration", a standing coverage
measure with no failing state. Gating on it would block every push while the
number never reaches zero.

## It caught something the moment it gated

```
metric-count | observatory/snapshot.json | repo_health.worklogs
  asserted 235, derived 236, delta 1
```

The snapshot was one worklog behind the repo. First live catch, immediately.

| | exit |
| --- | ---: |
| chain with `--strict` | **0** |
| a new fabricated timestamp | **3** |
| after removing it | **0** |

## My own error this turn

I used `git reset --hard` to revert the probe commit. That **silently discarded
my uncommitted edit** to `audit-asserted-numbers.mjs` — I only noticed when an
`Edit` failed to find its anchor.

Bounded by luck: the claim, ledger and trigger work were already committed. The
second probe used `git rm` plus a **soft** reset, which leaves the working tree
intact.

**`--hard` to undo a probe also undoes everything else you have not committed.**
