# Worklog: the speedup that was a silent failure

Date: 2026-08-05T02:33:11Z (generated filename)
Thread: getting the 437s suite onto the pre-push hook

## My hypothesis was wrong

I assumed `gate-selftest.sh` was slow because it replays the whole 8-gate
chain 15 times. It does not — it already invokes **single gates**. Ten cases
call `audit-asserted-numbers.mjs` directly, at 25s each.

The cost is one gate, and inside it, one query:

| | |
| --- | ---: |
| `select count(*) from passage` (41.5M rows) | **15,301ms** |
| vault queries | 1,411ms |
| local `person_topic` | 66ms |

**61% of the audit is one count**, and the vault — which I had warned about — is
not the problem.

## A fast answer I refused

`max(rowid)` returns **41501325 in 4ms**. `count(*)` returns **41501325 in
15,301ms**. Identical *today*.

I did not use it. Rowids gap the moment a row is deleted, so it would silently
overstate from then on. **A correct slow answer beats a fast one that can lie.**

## The cache that was a lie

I added a within-run cache. It showed **25s → 3s**, an 8× speedup.

It was not a speedup. `sqliteCache` was **referenced on three lines and
declared nowhere** — the ReferenceError made the audit *skip work* rather than
do it faster. `node --check` passes on this happily; an undeclared identifier
is only an error when the line executes.

Declaring it properly gave the honest number: **32s**.

Then I measured whether a cache could help at all: **11 sqlite derivations, 11
distinct (uri, query) pairs.** Nothing repeats. A cache can never hit.

**Removed**, with the reasoning left in the file so nobody re-adds it.

## What I did not achieve

The self-test still cannot run on every push. **367s**, and I found no honest way
to make it faster. Recording that rather than shipping `max(rowid)`.

Net change: one dead cache removed, one latent `ReferenceError` fixed, and the
timings written down so the next attempt starts from measurement instead of my
guess. All suites pass; 31 derivations, 0 skipped.
