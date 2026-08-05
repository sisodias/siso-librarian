# Worklog: one idea is not a search

Date: 2026-08-05T02:43:26Z (generated filename)
Thread: "I found no honest way to make it faster"

## The claim I made too early

Last turn I wrote that there was **no honest way** to speed up the 437s
self-test. I had tried exactly one thing — a cache — and that cache could never
have worked. One failed idea is not a search, and I wrote it up as a conclusion.

## What a second look found

**Not one self-test case exercises a sqlite derivation.** They break metrics
files, `package.json`, and snapshot labels under `bucket_counts` and
`god_questions`. The only derivation any case manipulates is
`fake.insensitive`, kind `file-count`.

Yet each of the ten audit invocations re-runs **11 sqlite queries**, including
that 15.3s `count(*)`, for work no case asserts anything about.

## `--skip-sqlite`, with two rules that make it safe

**It refuses `--strict`, exit 64.** A run that checks less may never be the run
that gates a push.

**The skipped count is reported unconditionally.** A skip visible only in the
runs where it happened is invisible in the runs where it matters:

```
--skip-sqlite   16 rederived, 26 skipped
normal run      31 rederived,  0 skipped
```

I had written that second rule into the comment before implementing it, then
found the count was **not** in the output — the silent-skip defect, in the flag
built to avoid it.

## It did not achieve what I set out to do

All 11 self-test cases need `--strict` to detect a gate firing, and
`--skip-sqlite` refuses `--strict`. **The flag cannot help the self-test.**

I kept the rule rather than weakening it to fit the goal. The self-test stays at
**367s** and off the hook.

## What it is actually worth

| | |
| --- | ---: |
| iteration check | **3s** |
| full check | 37s |

That is the loop I run dozens of times per turn, not the gate. The verify chain
is unchanged — still the full audit, still `--strict`.

All suites pass.
