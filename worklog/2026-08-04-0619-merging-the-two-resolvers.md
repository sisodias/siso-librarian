# Worklog: merging the two resolvers, and breaking it twice first

Date: 2026-08-04T06:19:12Z (generated filename)
Thread: verification hygiene

## Removing the deferral

Last loop I said merging `deriveCount` and `deriveValue` was the right fix and deferred it — "this isn't the loop to refactor the thing catching my mistakes."

That reasoning expired the moment I built `scratch-test.sh`. A refactor I can test against a throwaway clone, with a syntax gate in front of it, is not the risk I was avoiding. Deferring became the habit rather than the judgement.

## What the duplication was costing

```
deriveCount: json-scripts-count, sqlite, file-count, json-length
deriveValue: sqlite, jsonl-sum, jsonl-count, json-scripts-count, file-bytes
```

`sqlite` and `json-scripts-count` implemented twice. Each function missing kinds the other had. A derivation declared against the wrong caller resolved to `unavailable` while the gate reported success — which is precisely what happened to `repo_health.*` last loop.

Merged into one `derive()` with the union of kinds. Re-derived counts went **22 → 23**: the merge picked up a derivation the split had been silently dropping.

## I broke it twice getting there

**Attempt one:** a Python heredoc unescaped `\\n` into a literal newline inside a JS string. `node --check` caught it. Restored from git.

**Attempt two:** I "fixed" it with a placeholder token and `.replace()` — but the replace ran on a string Python had *already* interpreted, so the placeholder was never present. Identical failure, identical error message.

The second attempt is the interesting one: I diagnosed the symptom, applied a fix that did not address the cause, and got the same result. Only then did I stop using shell heredocs for multi-line JS and use the Edit tool, which has no escaping layer to fight.

Two wasted attempts because I kept reaching for the instrument I had rather than the one that fit. Same shape as chasing a screenshot artifact through four CSS changes.

## Verified across both paths

Falsifying one number in each code path — the snapshot loop and the declared-metrics loop:

```
CAUGHT people_graph.topic_edges  42 -> 2555047
CAUGHT repo_health.npm_scripts  999 -> 11
```

Both named their true values, which is what the drifted version could not do.

| Measurement | Before | After |
| --- | ---: | ---: |
| derivation resolvers | 2 | **1** |
| kinds implemented twice | 2 | 0 |
| counts re-derived per verify | 22 | **23** |
| falsification reports true value | one path only | both paths |

## Residual

The queued disk warning is **still undelivered** — fifth loop, link still down. `tailscale` shows the peer as `relay "sin"; offline` with `rx 0`, so it is reachable-in-principle and not answering.

Nothing in this loop touched the six blocked decisions. It was maintenance on the machinery, which is honest work but not the same as moving the Library forward, and I should be clear that the last several loops have all been of that kind.
