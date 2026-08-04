# Worklog: the binary I never checked

Date: 2026-08-04 08:30 UTC (from `date -u`)
Thread: GQ-004 — Best Software Primitive

## Choosing the primitive honestly

GQ-004 asks, for a *named* primitive, whether it is safe and valuable to reuse — with a rights gate and explicit reasons not to choose it.

The honest candidate was not something from the corpus. It was `pi`: the binary behind `mini-pi`, the lane I have been pushing bulk work through all night, whose licence and provenance I had never once looked at.

## What the check found

**The rights gate passes.** MIT, declared in `package.json`, author `Mario Zechner`, repository `github.com/earendil-works/pi`. Value is measured and real: ~71 input tokens per call against ~41,000 through the full harness.

**The resolution does not.** `mini-pi` sets `PI_BIN` to `~/.npm-global/bin/pi` and documents the package as `@mariozechner/pi-coding-agent`. That path **does not exist**. `@mariozechner` is not installed at all. The wrapper falls back to `command -v pi` at line 48, which resolves to `@earendil-works/pi-coding-agent` v0.80.10 via Homebrew.

Same author, republished under a different scope — so this is a rename, not a substitution, and I want to be careful not to inflate it into a security incident. But the shape is worth naming: **a wrapper that silently accepts whatever binary happens to be on PATH, while its comments name a package that is not installed.** The current binary is fine. Nothing would tell the wrapper if it stopped being fine.

Also: no LICENSE file ships in the installed tree. The MIT declaration is `package.json` only.

## The claim

Confidence 0.83 — high, because every element was read directly from the installed tree rather than inferred. Position separates the two findings cleanly: the dependency is fine, the way it is named and located is not.

Proposed action is to pin `PI_BIN` at the installed `@earendil-works` path and fix the comments. I have not applied it: `mini-pi` is shared tooling outside this repo, and every other agent on this machine uses that lane.

## The gate caught GQ-006 mid-loop

`npm run verify` exited 2 while I was working. Commit `8d820ea` had touched the GQ-006 claim after its `checked_at`, firing the action-status trigger correctly.

Re-derived both of its grounding byte ranges against source first — both still resolve — then updated the timestamp. That sequence is now habitual, which is the point of building it.

| Measurement | Before | After |
| --- | ---: | ---: |
| God Questions with local claims | 4 of 7 | **5 of 7** |
| claim packets | 7 | 8 |
| grounding ranges verified | 13 | 15 |
| claims about questions I did not mint | 4 | 5 |

## What is left

GQ-001 (The Agent Workspace, `partial`) and GQ-005 (Where the Field Is Moving, `scoped`) remain unclaimed. GQ-005 asks which techniques are gaining momentum and what that predicts — a corpus question I cannot answer from gateway logs and machine state, which is what tonight's evidence consists of. Claiming it would mean reaching for the people graph and book corpus properly, not repackaging what I already have.

That is the honest limit of this run of claims: five of the seven were answerable because tonight's work happened to produce the evidence. The remaining two need research, not assembly.
