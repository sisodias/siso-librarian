# Worklog: nothing was checking the checkers

Date: 2026-08-04T07:47:56Z (generated filename)
Thread: the gates themselves

## Why

Every gate in this repo checks artifacts. **Nothing checked the gates.** That is
not a hypothetical gap — three times this session a gate reported success while
detecting nothing:

- `if (!doc.derivations) continue` silently skipped seven unchecked files
- `snap.bucket_counts[group][key]` made `repo_health.*` audit nothing
- `if (typeof asserted !== 'number') continue` would have made four declared
  derivations decorative

Each was found **by accident**. A gate that stops detecting things looks exactly
like a repo with no defects, so accident was the only detection mechanism I had.

`scripts/gate-selftest.sh` inverts it: break something on purpose, require the
gate to fail, restore. Seven cases across four gates.

## It found one immediately

```
FAIL  refresh evaluator detects a stale entry claiming fresh — GATE DID NOT FIRE (exit 0)
```

The gate whose entire purpose is catching entries that claim fresh while their
triggers fired **did not fire**. Diagnosing it:

```js
} catch {
  return [];      // <- every git failure becomes "no commits fired"
}
```

`gitCommitsSince` swallowed **all** git errors and returned an empty list, which
is indistinguishable from "no triggers fired". Run where git cannot answer, the
gate reported all ten entries fresh and exited 0 — **maximum confidence from zero
information**.

My harness caused that specific case: I copied the tree without `.git`. But the
swallow is real. A corrupted index, or the gate invoked from the wrong cwd, would
produce the same silent all-clear on the live repo, and nothing would look wrong.

Two fixes:

1. `assertGitUsable()` — refuse to evaluate at all rather than report freshness
   from no evidence.
2. The catch now distinguishes the **one** legitimate case (a single-commit repo
   where `HEAD~1` does not resolve, which genuinely means nothing fired) from
   every other failure, which now exits 3 loudly.

## Fixing the harness too

The self-test had to give the refresh gate real history, since a copy without
`.git` gives it nothing to measure. It now inits a scratch repo with two commits
(the gate excludes HEAD deliberately) and backdates `checked_at` past them so the
triggers fire against real history.

I also added a standing probe for the swallow itself — run the gate with no git,
require non-zero. That case is now permanent rather than incidental.

```
PASS  claim schema rejects out-of-range confidence — exit 1
PASS  grounding detects a quote that no longer matches — exit 1
PASS  audit catches a falsified declared number — exit 3
PASS  audit notices evidence losing its derivations — exit 3
PASS  audit catches a reproducer that is not on disk — exit 3
PASS  audit catches a README command with no npm script — exit 3
PASS  refresh evaluator detects a stale entry claiming fresh — exit 2
PROBE refuses to evaluate without git — PASS (exit 3)

=== 7 passed, 0 failed ===
```

| Measurement | Before | After |
| --- | ---: | ---: |
| gates with a negative test | 0 of 4 | **4 of 4** |
| gates proven to fire | unknown | 7 cases |
| silent-failure modes found | 3 (by accident) | 4 (one by design) |

Pushed with verify exit 0.

## The honest reading

The fourth silent failure is the first one a *system* caught rather than luck.
That is the actual result of this loop — not the fix, which took ten lines, but
that the class of defect I kept stumbling into now has a detector.

It does not generalise beyond these seven cases. A gate can still rot in a way no
fixture covers, and I wrote both the gates and their tests, so a blind spot
shared between them stays invisible. What changed is that the specific failure
mode I have hit four times — a checker that agrees with everything — now costs a
deliberate lie to sustain rather than an accident.
