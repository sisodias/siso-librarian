# Worklog: are the gates load-bearing?

Date: 2026-08-05T00:41:50Z (generated filename)
Thread: the question I answered by accident, asked properly

## The question nothing asked

`gate-selftest.sh` proves each gate **fires** on a broken artifact. It does not
prove the chain would notice if a gate simply **vanished**. Different questions —
and yesterday the second one caught a real defect, by accident, on one script.

Seven gates in the chain. Nothing had ever asked it of the rest.

```
6 load-bearing, 0 not, 1 skipped
```

## What it proves, and what it does not

I added a gate that prints one line and checks nothing. **It reported PASS** —
because removing any named file makes the chain fail whether or not that file
did any work.

| | |
| --- | --- |
| proves | every gate is **invoked** and its exit code honoured |
| does **not** prove | that a gate checks anything meaningful |

`gate-selftest.sh` answers the second question by breaking artifacts on
purpose. This answers the first — which nothing did, and which is how a gate
silently leaves a chain: a typo, a rename, an `|| true`.

## The finding worth keeping

Appending **`|| true`** to one chain entry made **all six** real gates report
FAIL, because it swallows the exit code of everything downstream.

**Two words in `package.json` disable every gate at once**, and nothing else
in this repo would notice.

## Two artefacts of my own design

**BASELINE FAILED on the first run.** A scratch copy has one synthetic commit
touching every watched path, so all 10 refresh triggers fire. The evaluator
working correctly on artificial history — not a defect. Excluded that gate; it
has its own probe.

**Then `evaluate-refresh.mjs` reported FAIL.** I had excluded it from the
chain and still tested removing it, so the chain passed because it never invoked
it. That reads as *"not load-bearing"* when the truth is *"not tested"* — the
distinction I have now got wrong twice in two days. It skips explicitly.

Verify exit 0.
