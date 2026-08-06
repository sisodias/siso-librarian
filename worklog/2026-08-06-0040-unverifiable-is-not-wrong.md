# Worklog: unverifiable treated as wrong, for the third time today

## The symptom

During a rebuild, the gate blocked a push:

```
metric-count | external_corpus.books     | 1925      vs unavailable
metric-count | external_corpus.passages  | 2916805   vs unavailable
metric-count | external_corpus.words     | 231706114 vs unavailable
```

Three numbers that were **correct** and merely **unreadable** — the rebuild held
a lock on the corpus database.

## Why it matters

A rebuild takes about **40 minutes**. A gate that cannot pass for 40 minutes of
every ingest cycle is a gate that gets bypassed, and a bypassed gate is the thing
this whole layer exists to prevent.

## The script already knew

`audit-asserted-numbers` labels these `status: 'unverifiable'` — as distinct from
a number that was read and **disagreed**. The distinction was already there. My
gating filter, written this morning, simply ignored `status`.

## The same shape, three times in one day

```
1  mktemp failed        -> empty logfile      -> skip branch unreachable -> exit 9 on a correct corpus
2  unreadable log db    -> counts empty       -> "nothing to do", exit 0
3  locked corpus db     -> derivation missing -> gated a push on correct numbers
```

Each time, an input that **could not be read** was scored as a fact about the
thing being measured. Twice it produced a false pass; once a false failure. The
direction varies; the root does not.

## The fix

`unverifiable` and `source_missing` findings are **reported, never gated** — and
never counted as verified either. The report keeps them visible; the push does
not block on evidence nobody could gather.

| case | exit |
| --- | ---: |
| during a rebuild, corpus db locked | **0** — 3 unverifiable reported |
| a falsified snapshot number | **3** — still catches it |

The second row is the one that matters: the falsified number was still derivable,
so the gate caught it **even while the corpus database was locked**. Widening
what does not gate did not blind what does.
