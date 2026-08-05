# Worklog: fixing the root, not the symptom

Date: 2026-08-05T07:13:57Z (generated filename)
Thread: three probes that measured the wrong thing

## What I left undone last turn

I measured it: **8 scripts hardcoded the vault path, 1 was overridable.** Then I
fixed the one script whose probe had failed and moved on.

**A script that cannot be pointed at a fixture cannot be tested.** Three probes
this session reported PASS having read the real database instead of the copy
they were handed.

## `lib/vault-paths.mjs`

Third application of the same mechanism — `snapshot-paths` after four
snapshot mis-keys, `claim-paths` after five claim mis-keys, now this after
three false passes. **Seven scripts converted.**

Proven on the probe that lied:

```
last turn   page build vs a fixture missing passage_modern -> exit 0
now         exit 1 against the fixture, exit 0 against the real database
```

## A robustness gap the fixture exposed

With the override working, `search-library --stats` **threw** on a missing
`passage_modern` — which is exactly the state between an index rebuild and
`add-longs-variants`, because the index build drops the database.

It now reports the four counts it has and **names** the missing one. Not zero: a
zero would claim there are no long-s passages, when the truth is the table has
not been built yet.

## A bad edit I reverted

I tried to restructure control flow with string replacement and produced broken
syntax. `git checkout`, then re-applied both changes cleanly — which also cost
me the path conversion the revert undid. **String surgery on control flow is not
a patch; it is a rewrite with extra steps.**

## Verified after

```
rebuild --check     334 books, passage_modern present, catalogue 334
full rebuild        ran end to end, catalogue and index agree
suites              4 pass, 0 fail
verify              exit 0
```
