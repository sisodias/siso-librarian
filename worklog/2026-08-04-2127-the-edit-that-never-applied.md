# Worklog: the edit that never applied

Date: 2026-08-04T21:27:25Z (generated filename)
Thread: five comments satisfying checks meant for code

## The common mechanism

I have been fixing this one instance at a time all day. The fifth landed inside
my own patch script: I guarded an import insertion with
`if (!text.includes('claim-paths.mjs'))`, and the **comment I had just added
contained that string**, so the import was silently skipped.

Reproduced in isolation:

```
patch script exit   0    (reported success)
node --check        ok   (the file is valid — just missing the edit)
imports landed      0
```

**Both signals said success.** That is the entire defect: a no-op edit is
indistinguishable from an applied one unless something checks the *result*.

Notably, one script in this repo already got it right —
`minimax-cache-route.sh` runs `node --check` after patching and restores its
backup on failure. It is the one written as a reviewed operation. My throwaway
patches had no such discipline.

## `lib/patch.mjs`

The rule: **state what must be true after the edit, and verify it against the
file on disk** — not against the string you just built in memory.

| Case | Result |
| --- | --- |
| missing anchor | throws — expected 1 occurrence, found 0 |
| no-op edit (`find === replace`) | throws — content unchanged |
| failed post-condition | throws **and restores the file** |
| ambiguous anchor (3 occurrences) | throws by default; `count: 3` applies deliberately |

And proven on the real input: `ensureImport` lands the import into a file whose
**comment already contains the module name** — the exact case where my original
guard skipped it. Two imports on disk, symbol reachable as code.

## A wrong test I caught

I asserted that `'a'` was an ambiguous anchor in `export const a = 1;`. It
occurs **exactly once**. The helper was right and my test was wrong.

I asserted a count instead of deriving it — inside a test written to catch
asserted counts. The lesson arrives in costume again.

## Also

Removed a dead heredoc I left behind in the new probe. The probe still passes,
which is what proves it was unused rather than load-bearing.

Verify exit 0. Gate self-test: **15 passed, 0 failed**, including a probe that
requires the patch helper to reject a silent no-op.
