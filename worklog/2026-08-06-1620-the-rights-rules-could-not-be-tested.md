# Worklog: the two rules that decide what enters the corpus could not be tested

Today I added `age-settled` — which decides the **rights basis** a book is
admitted on — and a correspondence filter, which decides whether an item is a
**book at all**. Both lived inside `build-want-list.mjs`, a script that fetches
from the Internet Archive at import time.

Neither could be asserted without a network round-trip. **"Cannot be pointed at a
fixture" is the defect class that has cost the most here, and it had reached the
rights layer.**

## The fix

`lib/selection-rules.mjs`, imported by both `build-want-list` and
`build-external-passages`. One definition, so the two call sites cannot drift —
they already held two copies of the same regex.

Fourth application of this mechanism: `vault-paths` after eight hardcoded paths,
`claim-paths` after five mis-keys, `snapshot-paths` after four.

## Proving the refactor changed nothing

Rebuilding the want-list showed **1,802 → 1,840 items and 261 grade changes**,
which looked like the extraction had altered behaviour.

It had not — that is IA returning a different result set on a fresh query. Proven
by running both implementations over **fixed** inputs instead: 8 years × 4 grades
plus 7 titles, **39 cases, 0 disagreements**.

## The probe

Nine assertions, all boundaries rather than happy paths:

- **1928 upgrades, 1929 does not**
- a missing year **never** upgrades
- `none` and `not-a-designation` are **never** promoted, however old the work
- a printed periodical whose title contains "Letter" survives; a dated manuscript
  letter does not

Both halves proven to fail on their own defect:

| defect injected | result |
| --- | --- |
| cutoff moved to 2030 | **23 passed, 1 failed** |
| pattern broadened to `/letter/i` | **23 passed, 1 failed** |

## I reintroduced yesterday's defect and caught it

My first placement put the probe **above** the `probe_done` helper. It ran, and
its result was silently dropped — the suite still read **23**, not 24.

That is exactly the decorative-probe defect I fixed yesterday, reproduced within
a day. The only reason I noticed is that I check the count moves, not just that
the suite is green.

**23 → 24 passed, 0 failed.**
