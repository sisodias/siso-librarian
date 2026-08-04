# Worklog: a disputed claim was published as live

Date: 2026-08-04T08:15:38Z (generated filename)
Thread: coverage — classifying the 16, and what that turned up

## The defect the classification found

Going through the undeclared numbers one by one, `claims_live` read **8** while
my count of non-superseded, non-disputed claims was **7**. The builder:

```js
claimStatuses.filter((s) => s !== 'superseded' && s !== 'unreadable')
```

I added `disputed` to the schema last loop and never updated this filter. So the
claim whose per-category counts **matched no database on this machine** has been
published on the observatory as a live claim ever since — by me, in the same
session where I disputed it.

A **deny-list fails silently when a new value appears**; an allow-list would have
failed loudly. That is the whole bug.

Fixed, and `Claims (disputed)` is now its own row rather than folded away:

```
claims_live: 7 | disputed: 1 | superseded: 2
CAUGHT: claim_layer.claims_live 8 -> 7
```

The regression that just happened is now caught by a derivation, via a new
`json-status-count` kind.

## The classification I said I owed

Last loop: *"that 20 is a mixture I am describing rather than a set I have
classified."* Now classified, with the reason written per number:

```
undeclared: 16 of 48
explained: 16 | derivable-not-yet: 12 | genuinely un-derivable: 4
```

The four that genuinely cannot be derived are honest ones: a count of files that
**failed to parse** (re-deriving re-runs the same parse and agrees with itself),
an age relative to build time, a live ssh probe, and a network reachability
check. Every other undeclared number is work owed, and now says so.

Two new checks keep the classification honest in both directions:

- `snapshot-undeclared-unexplained` — an undeclared number with no rationale.
  Without it, "un-derivable" becomes a place to hide unfinished work.
- `snapshot-rationale-orphaned` — a rationale for a path that is no longer
  undeclared. Stale explanations vouch for numbers nobody is checking.

Both report **none**.

## One declaration I removed

I declared `repo_health.verify_steps` as `json-scripts-count` and then removed
it before building: that kind counts *scripts*, while the number counts `&&`
segments **within one script**. It would have disagreed immediately.

Better caught by reading than by the gate, but the honest note is that I wrote a
wrong declaration and the reason I caught it was checking what the kind actually
does — not intuition.

| Measurement | Before | After |
| --- | ---: | ---: |
| undeclared published numbers | 20 of 47 | **16 of 48** |
| counts independently re-derived | 26 | **31** |
| disputed claims counted as live | **1** | 0 |
| undeclared numbers with a written reason | 0 | **16 of 16** |

Self-test 8/8; verify exit 0.

## Residual

Twelve numbers are derivable and not yet derived. They need three new kinds — a
predicate over JSON arrays, a cross-directory join, and a text predicate over
markdown — which is a real piece of work rather than a line each. The count is
now a set with names and reasons, so it can be worked down rather than described.
