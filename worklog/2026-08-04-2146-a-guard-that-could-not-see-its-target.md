# Worklog: a guard that could not see its own target

Date: 2026-08-04T21:46:25Z (generated filename)
Thread: adopting the mechanism I built and never used

## The mechanism had no adopters

I built `lib/patch.mjs` last turn and had not used it once — every edit since
went through the same raw `str.replace` that caused the defect. **A mechanism
nobody adopts is a resolution wearing a mechanism's clothes.**

So I went to adopt it, and found there was **nothing to adopt it into**:

| | |
| --- | ---: |
| scripts that read and write files | 11 |
| scripts that patch **in place** | **0** |

`build-observatory`, `ia-ingest` and `ia-dedup-check` use `.replace()`
for string normalisation and display formatting. They **generate** files. The
production code never had this defect — **only my ad-hoc session edits did**.

That is the real finding, and it is not the one I expected: the defect lives in
how I work, not in the repo.

## The one real exposure, and my failed fix

`gate-selftest.sh` patches files **13 times by design**. If a mutation
silently does nothing, the target stays healthy, the gate correctly exits 0, and
the case reports **"GATE DID NOT FIRE"** — blaming a working gate for a broken
test.

I added `cmp -s` to prove each mutation changed the file. Then I tested it by
making one case a no-op on a scratch copy:

```
PASS  claim schema rejects out-of-range confidence — gate exited 1
=== 15 passed, 0 failed ===
```

**The guard stayed silent.** Most mutations round-trip JSON, and `json.dump`
reformats the file even when the value is unchanged — so the bytes differ and
`cmp` cheerfully reports "changed" for a mutation that changed nothing.

**Removed**, with the reasoning left in the file so nobody re-adds it.

## Why removing it is the right call

The honest check already exists, and it is semantic rather than byte-level:
`check()` requires the gate to exit **non-zero**. A no-op mutation makes the
case report FAIL, which correctly says *this case proves nothing*.

A check that cannot detect its own target is decoration — and decoration in a
gate is worse than an absence, because it reads as coverage.

Net change this turn: **one bad guard removed**, and a negative result written
down. Verify exit 0. Gate self-test: 15 passed, 0 failed.
