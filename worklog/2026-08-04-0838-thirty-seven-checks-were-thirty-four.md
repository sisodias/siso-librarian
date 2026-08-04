# Worklog: thirty-seven checks were thirty-four

Date: 2026-08-04T08:38:33Z (generated filename)
Thread: the uncovered half — a derivation reading a real-but-wrong source

## What I went looking for

Sensitivity proves a derivation reads *something at its named path*. It cannot
prove the path is the **right** one, because a derivation counting the wrong
directory is fully sensitive to that wrong directory. That is the half of the
four-times defect still uncovered — and it is the half that nearly made me
refute a true claim.

So I looked at where a wrong-but-real source could hide: derivations sharing a
source and kind, whose values coincide.

## I made the same error again, in the analysis

My first pass reported every group as colliding, with values `None`. I had
stripped the `bucket_counts.` prefix and then walked the **stripped** path
against the full document — the identical prefix-mismatch that made me report 42
undeclared numbers when the truth was 24.

Fifth instance this session, and this time inside a script written specifically
to hunt for that class of bug. It is not a lesson I have learned yet; it is a
lesson I keep re-encountering, which is a different thing.

Fixed by trying both key shapes and taking whichever resolves to a number.

## The real finding

Three pairs of derivations carry **identical source, kind, and query**:

```
release_integrity.works_total      ==  registry.works           (*.json)
god_questions.total                ==  coverage.registered      (frontier-question-*.json)
release_integrity.releases         ==  registry.releases        (*.json)
```

Not wrong — each pair genuinely measures one thing under two names. But each
pair is **one check, not two**, so "37 derivations re-derived" overstated the
independent verification behind the page.

```
derivations declared:   37
independent checks:     34
duplicate declarations:  3
```

This matters specifically for the uncovered half: **duplicate declarations
cannot cross-check each other.** If `registry.works` pointed at the wrong
directory, `works_total` would point at the same wrong directory, return the
same wrong number, and agree perfectly. Two confirmations that are really one.

| Measurement | Reported | Actual |
| --- | ---: | ---: |
| independent derivation checks | 37 | **34** |
| duplicate declarations | 0 (unknown) | 3 |
| collision groups examined | — | 4 |

Self-test 9/9; verify exit 0.

## What I did not do

I did not delete the duplicates. Two names for one measurement is how the page
reads naturally — `registry.works` is a bucket count, `works_total` is a release
integrity denominator — and collapsing them would make the page worse to serve a
number. Reporting the distinction is the honest fix; removing the redundancy
would be cosmetic.

The wrong-source half remains uncovered. Nothing here detects a derivation
pointed at a real directory that is not the one it should read — for that I
would need to know the intended source independently of the declaration, which
is the same problem as needing a second party to review a claim.
