# Worklog: my own rule was the blocker

Date: 2026-08-05T02:57:34Z (generated filename)
Thread: "the self-test cannot run on every push"

## The blocker was mine

Last turn I built `--skip-sqlite`, made it **refuse `--strict`**, and then
concluded the self-test could not use it — because all eleven cases need
`--strict`.

I had written the obstacle myself, one turn earlier, and then reported it as a
limit of the problem.

## Why the rule was wrong

I conflated `--strict` with *"checks everything"*. It is **one line**:

```js
if (process.argv.includes('--strict') && findings.length) process.exit(3);
```

An **exit-code** switch, not a coverage switch. The real danger is narrower: a
skipping run standing in for **the run that gates a push** — and that is the
pre-push hook, not the self-test.

Verified before changing anything: lifted the rule on a scratch copy, falsified
a declared number, and the audit still exited **3** under `--skip-sqlite`.

The rule now targets the danger directly — it refuses when `GATING=1`, which
the hook sets:

```
GATING=1 + skip           -> exit 64
--strict + skip (normal)  -> exit 3 on findings
```

## Result

| | before | after |
| --- | ---: | ---: |
| gate self-test | 367s | **56s** (6.5×) |
| quick suite | 128s | **118s** |
| suites on the hook | 2 | **3** |
| pre-push hook | — | **117s** |

**Coverage is unchanged**, and I checked rather than assumed: removing the
audit's `--strict` exit on a scratch copy makes **10 of 15 cases fail**. They
still detect a broken gate.

The quick suite got **faster while running one more suite**, because the audit
inside `verify` also got quicker.

## What is still off the hook

`gates-are-load-bearing.sh`, ~300s — it replays the whole chain once per gate,
which is irreducible for what it measures. Runs from `npm run check:all`.

Full suite: **4 pass, 0 fail**.
