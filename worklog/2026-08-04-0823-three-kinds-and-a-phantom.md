# Worklog: three kinds and a phantom

Date: 2026-08-04T08:23:26Z (generated filename)
Thread: coverage — the twelve derivable-not-yet

## Built

Three derivation kinds, which closed five of the twelve:

- `json-predicate-count` — count JSON files satisfying a predicate over their
  contents. Needed because "has a testable contract" means several arrays are
  all non-empty, which no file count expresses. The predicate is a **restricted
  mini-language**, not `eval`: `a.b.c+` requires non-empty, `?` requires
  present. Accepting arbitrary JS would let a clever declaration make the audit
  agree with anything.
- `json-join-count` — distinct field values across one directory, optionally
  intersected against ids in another. The release-integrity numbers cannot be
  counted from either directory alone.
- `text-match-count` — regex matches in a text file, for the decision count
  that lives in a markdown proposal.

```
undeclared      16 of 48  ->  11 of 48
re-derived              31  ->  35
derivable-not-yet       12  ->   7
```

## The phantom the join invented

Testing before declaring, `works_without_releases` came out **25** against a
published **0**.

My join built its `have` set from both the work `id` **and** the filename. The
builder matches on `id` alone, so the 25 filenames could never be referenced by
anything — I had invented 25 phantom works and confidently reported every one as
orphaned.

Had I declared first and tested after, that would have read as a genuine
registry defect: twenty-five works with no release, in a registry that is fine.
Fixed to ids only.

This is the fourth time this session the pattern has been **a checker keyed
differently from the thing it checks** — `person_topic` vs `person_content`,
`bucket_counts.` prefix vs bare, hyphen vs underscore, now id vs filename. Each
time it produced a confident wrong number rather than an error.

## The orphan check earned its place

Declaring five numbers made their five rationales stale, and
`snapshot-rationale-orphaned` — added last loop, never yet fired — named all
five exactly. Removed them.

That check existed because I reasoned a stale explanation would vouch for an
unchecked number. It caught its first real case one loop later, on my own work.

## Also noticed, not fixed

Decision 5 in the awaiting-Shaan proposal says *"Six registered God Questions
have no testable contract."* That is stale — all seven have contracts now. It is
Shaan's document to resolve, and rewriting a decision he has not answered would
destroy the record of what he was actually asked. Flagging rather than editing.

| Measurement | Before | After |
| --- | ---: | ---: |
| undeclared published numbers | 16 of 48 | **11 of 48** |
| counts independently re-derived | 31 | **35** |
| derivation kinds | 12 | **15** |
| phantom works my own checker invented | 25 | 0 |

Proven to catch wrong values, not merely agree:
```
CAUGHT: release_integrity.works_referenced 1 -> 25
CAUGHT: awaiting_decision.count           99 -> 7
```

Self-test 8/8; verify exit 0.

## Residual

Seven derivable-not-yet remain. Two are routing token sums over a **trailing
window relative to build time**, so they legitimately move between builds — they
need a windowed derivation kind that pins the window, or they belong with the
un-derivable four. I have not decided which, and would rather leave them counted
honestly than pick the classification that makes the number smaller.
