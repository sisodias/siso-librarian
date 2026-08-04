# Worklog: a mechanism, not a resolution

Date: 2026-08-04T21:12:20Z (generated filename)
Thread: five wrong keys, and what I said I would do about them

## The fix I proposed last turn was not a fix

I wrote: *"the fix isn't more care — it's reading the structure before writing
the query."* That is a **resolution**. Today has been a long lesson in
resolutions failing silently.

There was already a precedent sitting in the repo. `lib/snapshot-paths.mjs`
was written after four snapshot mis-keys, and **that class stopped recurring**.
Nothing equivalent existed for claim structure — which is where four of today's
five landed.

## The finding that sharpened it

The production scripts were **never wrong**. `audit-asserted-numbers.mjs`,
`verify-claim-packets.mjs` and `build-review-packet.mjs` all read
`source.id` correctly and agree with each other.

The defect was that **I kept writing throwaway readers instead of using them**.
So the fix is not correcting code; it is making the correct reader the one that
is easy to reach for.

`lib/claim-paths.mjs`, proven against a known-wrong answer:

| Reader | Grounded metrics files |
| --- | ---: |
| my hand-rolled one, last turn | **0** |
| the helper | **14** |

A confident zero is worse than an error, because it looks like a finding.

## What it then told me

Of 14 load-bearing metrics files, exactly **one** has nothing re-checking it:
`2026-08-04-gq005-category-momentum.json`.

And it is honest. Its `source` field already reads **"UNKNOWN — see dispute in
the claim"**, the claim carries the portfolio's **lowest confidence, 0.15**, and
its action says *"not a basis for investment"*. The claim layer did its job:
unsourceable evidence produced a low-confidence, no-action claim rather than a
hidden one.

So the helper now separates a **disclosed limit** from an **oversight**.
Lumping them would make the honest case look like the negligent one.
**Oversights needing work: 0.**

## A sixth wrong key, while fixing the fifth

My patch script guarded on `"claim-paths.mjs" not in t` — but the **comment I
had just added contained that string**, so the import was silently skipped. The
audit then threw `ReferenceError` at runtime while passing `node --check`.

**Fifth time today a comment satisfied a check about code**, and this time
inside my own patch script. The lesson keeps arriving in different costumes.

| | |
| --- | ---: |
| verify | **exit 0** |
| gate self-test | **15 passed, 0 failed** |
| derivations | **32**, 0 skipped |

The new case breaks `groundingSourceId` on purpose and requires the audit to
notice — because a reader that silently stops resolving would report a clean
repo having checked nothing.
