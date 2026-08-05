# Worklog: a treadmill I built

Date: 2026-08-05T04:07:34Z (generated filename)
Thread: the blocked push I treated as a one-off

## It was not a one-off

Last turn the hook refused my push: ten ledger entries disagreed, fired by
`new evidence source`. I re-derived grounding, refreshed the ledger, pushed
clean — and moved on.

But that trigger watches `sources/`, and **writing a want-list is what every
ingest does**. Each future ingest would mean one blocked push and ten
hand-refreshed entries. Forever.

## The measurement that settled it

| | |
| --- | --- |
| live claims grounding in `sources/` | **1** |
| what it cites | `adapter-contract.json` |
| what my commit changed | `want-list-weak-subjects.json` |

**The trigger blocked a push over a file that zero claims ground in.**

The precedent was already sitting in the file, three lines above:

> *a trigger that fires on maintenance trains you to dismiss it*

I wrote that on 2026-08-04 while narrowing `schema change` — and left its
neighbour broad.

## Narrowed, and measured over full history

```
'sources/'                    -> 9 commits
contracts only                -> 2 commits
```

**Seven maintenance commits will no longer block a push**, and both genuine
contract changes are still caught (`a8cdca2`, `3aa3db1`).

## A test of mine that was wrong

I built a scratch repo, touched the want-list, and expected no trigger. **All
three fired.** The scratch copy has one synthetic base commit touching every
watched path at once — the same artefact that broke the load-bearing baseline
earlier today.

**A git-history gate cannot be tested on synthetic history.** The honest test is
the pathspec against the real log, which is how I confirmed it: the new pattern
matches the two contract commits and does not match the ingest.

Verify exit 0. Suites 3 pass, 0 fail.
