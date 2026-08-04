# Worklog: closing the hole I found and left

Date: 2026-08-04T05:44:19Z (generated filename)
Thread: verification of asserted values

## Not leaving it for the successor

Last loop I discovered my auditor enumerates metrics with `git ls-files`, so **untracked files were invisible to it** — a new metrics file's numbers went unchecked until someone committed it. I noted it as "benign since I commit every loop" and moved on.

That was the wrong call twice over. It is the same silent-pass pattern I have now fixed five times tonight, and I had already reversed exactly this kind of deferral two loops ago when I said a five-line fix to a tool I understand should not be handed forward.

## The change

The auditor now walks `metrics/` on disk rather than reading the git index, audits every file it finds, and **reports untracked ones as a finding** rather than skipping them.

Both halves matter. Auditing from disk means new numbers are checked immediately. Reporting untracked files means the *other* risk stays visible: a file present locally but absent from a fresh clone, which is how the successor would experience it.

```
metrics seen: 31   untracked: 0   derivations: 11   sources: 30
```

## Tested by creating the condition

A count of zero untracked files proves nothing when there are none. So I created one:

```
seen: 32  untracked: 1
  FLAGGED: metrics/zz-untracked-probe.json
```

Removed it; back to 0. The probe file was deleted, not committed.

## A mistake in the middle

My first version called `walk()`, which exists in the verifier — a different script. The auditor crashed with `ReferenceError: walk is not defined`, and my JSON parser reported a confusing decode error because it was reading empty output.

I read the actual stderr instead of guessing, found the missing helper, and added it locally. Worth recording because the *symptom* — a JSON decode failure — pointed nowhere near the cause, and the fix was thirty seconds once I looked at the real error rather than the one my wrapper surfaced.

## Residual

The same `git ls-files` pattern still governs the **worklog** enumeration on line 26. Untracked worklogs are invisible to the timestamp audit for the same reason.

I am leaving that one deliberately: worklogs are narrative and an uncommitted one is genuinely not part of the record yet, whereas an uncommitted metrics file contains numbers other artifacts may already cite. The asymmetry is real, but I am flagging it rather than pretending the inconsistency is invisible.
