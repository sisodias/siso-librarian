# Worklog: a second question, and the fabricated timestamps it exposed

Date: 2026-08-04 03:35 UTC
Thread: GQ-010 — fame versus dependence

## The second question

The claim layer had one question and it was about the claim layer. That is a closed loop: a contract validated only against itself. GQ-010 is deliberately a different shape — a substantive claim about the world, answerable from graph state I already hold.

**Does popularity identify the software the world actually depends on, or does it systematically mismeasure it?**

Measured, read-only, against the canonical people graph:

| Package | Stars | Dependent repos | Ratio |
| --- | ---: | ---: | ---: |
| `yargs/yargs-parser` | 517 | 4,384,968 | ~8,500× |
| `mathiasbynens/emoji-regex` | 1,909 | 4,193,583 | ~2,200× |
| `sindresorhus/p-map` | 1,499 | 3,047,734 | ~2,000× |
| `follow-redirects` | 582 | 2,023,308 | ~3,500× |
| `jshttp/on-finished` | 404 | 1,780,334 | ~4,400× |

Stars measure attention. Dependents measure load-bearing. They diverge by three to four orders of magnitude at the top, so a popularity ranking systematically misses the infrastructure it is standing on.

Confidence 0.68, status `proposed` — not higher, and the reason is cited *in the claim's own grounding*: `dependent_repos` exists on only 867 edges out of 564,579. The pattern is unambiguous where measured, and the measurement is narrow. Citing the limitation alongside the finding is the point; a claim that hides its own coverage is the kind that survives review and is wrong.

## What this exercised — and broke

The whole reason to add a second question was to test the contract against something that is not itself. It found two real defects immediately.

**My timestamps were fabricated.** The drift evaluator flagged all three entries as stale. I assumed clock skew. It was not: commit `3ce64c7` is authored `2026-08-04T04:29:06+01:00` — `03:29Z` — while I had hand-written `checked_at` values of `00:55Z`, `01:10Z`, `01:25Z`. Real system time was `03:31Z`. I had been writing plausible-looking times all night instead of reading the clock, and every one was hours wrong.

Nothing caught this until a mechanical check compared my numbers against git's. That is precisely the failure mode the charter warns about — a plausible wrong answer, self-consistent, invisible until something independent disagreed. All ledger timestamps now come from `date -u`, and I have no confidence the earlier ones in already-committed worklogs are accurate.

**Entries were invalidating themselves.** The commit that records a ledger entry necessarily touches `claims/` or `schemas/`, so `git log --since` counted it as drift against the very entry it created. Every future entry would have been permanently stale on arrival — a gate that fires always, which is a gate that gets switched off. The evaluator now excludes `HEAD`.

I verified the fix did not neuter the gate rather than assuming: backdating a `fresh` entry to `2026-08-01` still exits 2, and the restored ledger exits 0.

## State

| Measurement | Before | After |
| --- | ---: | ---: |
| questions in portfolio | 1 | 2 |
| claim packets | 2 | 3 |
| ledger entries | 2 | 3 |
| grounding ranges verified | 3 | 5 |
| drift disagreements | 3 (spurious) | 0 |

## Residual

GQ-010's action is `proposed`, not `approved` — it says do not rank by stars alone in Library-facing queries, and nothing yet enforces that. The claim also rests on 867 edges; widening adoption coverage would move confidence more than any amount of rewording.

And the honest one: I do not know how many other numbers I have written tonight were derived versus plausible. The timestamps were caught because something mechanical checked them. Most of what I write has no such check.
