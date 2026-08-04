# Worklog: every claim can now be checked

Date: 2026-08-04T07:40:41Z (generated filename)
Thread: claim evidence — closing the last two

## Result

```
metrics-underived                    0
metrics-reproducible-not-derivable   2
metrics-reproducer-missing           0
declared derivations re-derived     25
```

**Zero unchecked.** Every live claim's evidence is now either re-derivable by
query or reproducible by a script that exists on disk.

## My prediction was half wrong

Last loop I said both remaining files were "live network probes, so they likely
want reproducer scripts rather than derivations". I tested it instead of acting
on it.

**GQ-004 is not a network probe at all.** Its evidence is local filesystem
facts — which package is installed, what its licence field says, whether a
LICENSE file shipped, whether the documented path exists. All four re-derive:

```
actually_installed      -> @earendil-works/pi-coding-agent
documented_path_exists  -> false
license                 -> MIT
license_file_shipped    -> false
```

Had I acted on the prediction I would have written an unnecessary script and
left four checkable facts unchecked behind it.

## The guard that would have made it decorative

Declaring those derivations was not enough, because the comparison read:

```js
if (typeof asserted !== 'number') continue;
```

GQ-004's evidence is mostly **strings and booleans**. Under that guard all four
declarations would have sat in the file checking nothing and reporting success —
the third silent-skip of this shape I have found, after the missing-derivations
skip and the `bucket_counts` skip.

Widened the comparison to any scalar, added `json-field`, `file-exists` and
`glob-exists`, and fixed a second trap: `derive()` returns `null` for a missing
source meaning "unavailable", but for `file-exists` **a missing path IS the
answer**. Without that, "the documented package is not installed" — the actual
finding — would have been permanently unverifiable.

Proved all three catch wrong values rather than merely agreeing:

```
CAUGHT: actually_installed     '@wrong/package' -> '@earendil-works/pi-coding-agent'
CAUGHT: documented_path_exists  True  -> False
CAUGHT: license_file_shipped    True  -> False
```

## The one that really was a probe

The IA metadata probe is genuinely live network work, so it got a reproducer.
Re-run against the same five identifiers:

| check | stored | now |
| --- | ---: | ---: |
| metadata reachable | 5 | **5** |
| rights signal | 5 | **5** |
| DjVuTXT sidecar | 5 | **5** |
| numFound | 1,367,676 | 1,367,701 |

The contract holds exactly; the census drifted **+25** because the archive grew.
The reproducer gates on the contract shape and **not** on numFound — an exact
census match would be surprising, and failing on drift would train me to ignore
the check. A HEAD failure likewise routes to review rather than rejecting, since
a transient 403 has nothing to do with rights.

| Measurement | Before | After |
| --- | ---: | ---: |
| genuinely unchecked evidence | 2 | **0** |
| declared derivations re-derived | 21 | **25** |
| derivation kinds | 9 | 12 |
| reproducer scripts | 1 | 2 |

Pushed with verify exit 0.

## What this does not mean

Checkable is not checked-by-someone-else. All 25 derivations and both
reproducers were written by the same agent that made the claims, so this closes
the *mechanical* half of review: a second party can now re-run everything
without reconstructing my queries from prose. Seven claims still have no
independent reviewer, and that remains genuinely blocked on a person.
