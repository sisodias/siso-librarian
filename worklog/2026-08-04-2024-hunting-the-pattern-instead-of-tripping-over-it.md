# Worklog: hunting the pattern instead of tripping over it

Date: 2026-08-04T20:24:07Z (generated filename)
Thread: prose satisfying checks meant for code

## Why I went looking

Three times today I matched prose instead of the field it describes, and each
time I found it by accident:

1. A comment `// UNION book_external` satisfied the coverage gate.
2. A comment in `gate-selftest.sh` discussing `\`from book\`` triggered a
   false positive.
3. A `source_note` explaining a repoint kept the resolved warning alive.

**A pattern found three times by luck will be found a fourth time by luck**
unless someone goes looking. So I went looking.

## The fourth instance

`audit-asserted-numbers.mjs` decided a script was reachable with
`readme.includes(rel)` — any mention of the path anywhere in the README.

Demonstrated on a scratch copy:

```
We once considered scripts/orphan-probe.mjs but abandoned it.
```

**A sentence stating the script was ABANDONED marked it as reachable.**

Fixed to require an actual invocation — `node`/`bash`/`sh`/`npm run`
followed by the path — or a `package.json` script.

## Tightening broke something, and I checked before shipping

The tightened rule immediately flagged `scripts/lib/snapshot-paths.mjs`. That
is a **library**, imported by the very file doing the checking, never invoked.
Counting an import as a reference fixed it.

Tightening a check is not free. The tightened rule must still model how the code
is actually reached, or it just trades false negatives for false positives.

## Two real orphans it found

| Script | Status |
| --- | --- |
| `minimax-cache-route.sh` | carried all day as "written, tested, not applied" — **and unreachable from any command** |
| `probe-ia-metadata.mjs` | named in the README, absent from `package.json` |

Both registered as npm scripts. Resolving a true finding by making it false is
the wrong repair; the gate was right.

## Order of operations on the ledger

`verify` exit 2 — "approved action status change", fired by my own claim
correction in `c29a235`. Grounding re-derived **first**: 30 byte ranges
checked, **0 broken**. Only then the ledger. Ten entries refreshed rather than
one, because all ten shared a `checked_at`; the re-derivation covered every
claim, so that is honest rather than convenient.

Verify exit 0. Gate self-test: **14 passed, 0 failed**, including a new probe
asserting that a prose mention does not count as a reference.
