# Worklog: the first claim I reviewed was mine

Date: 2026-08-04T07:16:04Z (generated filename)
Thread: 8 claims awaiting review — treated as blocked on a person

## What I had been assuming

"Claims awaiting review: 8" has sat on the observatory for the whole session,
and I have been reporting it as blocked on an independent reviewer. Some of it
is — I cannot be the second party. But **re-deriving a claim's evidence is not
the same as reviewing it**, and that part was never blocked.

## The finding

`GQ-005-category-momentum` asserts that agent infrastructure is where
maintenance effort concentrates: agent-memory-store at 74.4% recent-push against
a 44.8% corpus baseline, ml-paper-impl below it at 34.9%.

Its metrics file names **`source: null`** and carries **no derivations block**,
so nothing had ever re-derived it. Checking:

| check | result |
| --- | --- |
| corpus baseline 44.8% | **reproduces exactly** — 463,221 edges, 207,329 recent |
| `gh_category` field | **absent** — not among the 38 meta keys in people_v2; 0 rows mention these slugs |
| taxonomy located | real, but in `identity.sqlite` — a **different database** than implied |
| agent-memory-store | claim says **929** repos; taxonomy holds **181** |
| agent-extension-pack | claim says **17,538**; taxonomy holds **3,052** |
| recompute pct_recent | **impossible** — `repo_observation` has no `pushed_at` |

The one number that reproduces is the **baseline the comparison is measured
against**, not the comparison. Everything built on top of it matches no database
on this machine.

## Why not "rejected"

The schema offered `proposed / accepted / superseded / rejected`. None fit.
`rejected` asserts the position is **wrong**; I did not show that. I showed it is
**unverifiable** — a different state that was unrepresentable, so an
unreproducible claim could only sit at `proposed` looking like pending work.

Added `disputed` plus a required `dispute` block (finding, checks, verdict,
remedy). Confidence 0.62 -> 0.15.

## The part I nearly shipped

I wrote the `allOf`/`if-then` requiring a dispute block, then "verified" it by
reading the schema in a node one-liner and printing **"correctly caught"**.

It was not caught. This validator is a hand-rolled subset of JSON Schema and
**silently ignores unsupported keywords** — my constraint existed in the file and
enforced nothing. I only found out by writing the negative fixture and running it
through the real verifier, which printed `ok (0 schema errors)`.

So I implemented `allOf`/`if`/`then`/`else`, and re-ran both directions:

```
NEGATIVE (disputed, no dispute block):  $.claim: missing required property dispute
POSITIVE (real claim):                   ok (0 schema error(s))
```

**A test that reasons about a checker is not a test of the checker.** That is the
same failure as the hyphen/underscore path, where producer and checker shared a
wrong assumption and agreed with each other.

| Measurement | Before | After |
| --- | ---: | ---: |
| claims re-derived by anyone | 0 | 1 |
| unverifiable-but-live claims | 1 (invisible) | 0 |
| claim statuses available | 4 | 5 |
| conditional schema support | none (silently ignored) | implemented, both directions proven |

## Residual

Seven claims still have no second party, and that remains genuinely blocked.
But I have stopped treating "awaiting review" as a single blocked state: the
re-derivable part is mine to do, and the first one I checked did not survive it.
