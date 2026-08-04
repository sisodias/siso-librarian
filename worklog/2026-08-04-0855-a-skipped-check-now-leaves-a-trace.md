# Worklog: a skipped check now leaves a trace

Date: 2026-08-04T08:55:50Z (generated filename)
Thread: the property that made every silent skip invisible

## The sentence I wrote last loop

*"I do not know how long they were skipped, and the audit cannot tell me — a
skipped check leaves no trace, which is the whole problem with silent skips."*

That was true and it was fixable. The audit knows what it skipped at the moment
it skips; it simply threw the information away.

## Every silent skip this session

```
if (!doc.derivations) continue          ->  7 unchecked files, invisible
snap.bucket_counts[g][k] hardcoded      ->  repo_health.* audited nothing
if (typeof asserted !== 'number')       ->  4 declarations would be decorative
resolveLabel failing                    ->  scripts_on_disk 17 vs 18, unknown duration
```

Four instances, one property: **the audit reported success while having examined
less than it appeared to, and nothing distinguished "checked and clean" from
"never looked".**

## What changed

Two skips now produce findings instead of vanishing, and a `checks_skipped`
total sits in the summary so the distinction is visible at a glance:

- `declared-derivation-unresolvable` — someone wrote down how to check a number
  and the check does nothing. This is the worst case in the file: the presence
  of a declaration is what makes it look covered.
- `metrics-unparseable` — evidence that **cannot be read**, which is strictly
  worse than evidence that disagrees, and used to vanish entirely. It reports
  whether a live claim grounds in the file.

Proven in both directions:

```
CAUGHT: nowhere.at.all -> undefined                          (checks_skipped 1)
CAUGHT: gq010-underrated-evidence.json  grounded=True        (checks_skipped 1)
restored                                                     (checks_skipped 0)
```

The `grounded=True` on the second is the part that matters — it is the
difference between a broken scratch file and a live claim whose evidence cannot
be parsed.

| Measurement | Before | After |
| --- | ---: | ---: |
| skip sites that report | 0 of 14 | 2 of 14 |
| `checks_skipped` in summary | absent | **0** (and proven to move) |
| gate self-test cases | 10 | **11** |

Self-test 11/11; verify exit 0.

## Twelve skips still silent

I fixed the two that hid real defects, not all fourteen. The rest are mostly
legitimate — a worklog with no timestamp in its name genuinely has nothing to
check, and reporting it every run would be noise that trains me to ignore the
output.

But "mostly legitimate" is a judgement I made by reading them, not a
verification. Two of the four defects this session came from a skip I would have
called legitimate before it bit me, so that judgement has a demonstrated error
rate. The honest position is that `checks_skipped: 0` means *zero of the two
kinds I now count*, not zero skips.
