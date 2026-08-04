# Worklog: I nearly refuted a true claim

Date: 2026-08-04T07:34:39Z (generated filename)
Thread: claim evidence — giving the gate the vocabulary I said it lacked

## The near miss

GQ-006 asserts **90,209** curated awesome-cited owners. I re-derived it and got
**76,106**, and had every reason to feel confident: I had spent three loops
finding exactly this kind of disagreement in other people's numbers.

I was wrong. The count lives in `person_topic (scheme='curated',
topic='awesome-cited')`, **not** in `person_content.meta_json` where I looked.
Against the correct table it is **90,209 exactly**.

What makes this worth recording is that my wrong query returned a *plausible*
number. So did the next one:

```
person_content, distinct persons  ->  76,106
person_content, distinct edges    -> 119,604
person_content, list_count        ->  76,260
person_topic  (correct)           ->  90,209
```

Three defensible-looking answers, none of them the claim's. **A checker
measuring the wrong table disagrees confidently, and that is indistinguishable
from a real contradiction** until you find the original query. I had been
treating my own re-derivations as authoritative; this one would have marked a
true claim as disputed.

I only caught it because I went looking for where 90,209 came from instead of
trusting my disagreement. The remedy is now recorded in the metrics file so the
next person to re-derive it does not repeat my hour.

## The vocabulary I said the gate lacked

Last loop I wrote that "reproducible, not derivable" had no representation, and
left GQ-008 flagged. That was mine to fix. The audit now distinguishes three
states instead of collapsing them:

- `metrics-underived` — no derivations, no reproducer. Genuinely unchecked.
- `metrics-reproducible-not-derivable` — a live experiment with a
  `reproduced_by` script **that exists on disk**. Informational, not a defect.
- `metrics-reproducer-missing` — names a reproducer that is **not** on disk.

That third branch matters most: a pointer to a missing script reads as covered
while checking nothing. I proved it fires by pointing GQ-008 at
`scripts/does-not-exist.sh` and watching it get caught, then restoring.

## Point-in-time counts

GQ-001's session counts (54 commits, 46 worklogs) looked unverifiable — the
session has grown to 88 and 77, so a live derivation would report a **permanent
false mismatch**. Anchoring each query to the commit that was HEAD at
`measured_at` re-derives commits and worklogs **exactly**.

One number does not reproduce: `metrics_files` asserts 27, git says 26. A
metrics file was on disk but **untracked** when the snapshot was taken. The
assertion was true of the disk and is not reproducible from history. Recorded
rather than quietly corrected.

I had to implement `git-rev-count` and `git-ls-count` for this, because I first
declared kinds the resolver did not support — they reported `source_missing` and
checked nothing, which is the decorative-declaration failure I flagged in others
two loops ago. Proved they work by asserting `commits: 999` and watching
`derived 54, delta -945`.

| Measurement | Before | After |
| --- | ---: | ---: |
| genuinely unchecked evidence | 5 | **2** |
| declared derivations re-derived | 18 | **21** |
| audit states for evidence | 1 | 3 |
| true claims I nearly disputed | — | 1 (caught) |

Pushed with verify exit 0.

## Residual

Two files remain genuinely unchecked: the IA metadata probe and GQ-004's
primitive evidence. Both are live network probes rather than local queries, so
they likely want reproducer scripts rather than derivations — the same shape as
GQ-008, which now has one.
