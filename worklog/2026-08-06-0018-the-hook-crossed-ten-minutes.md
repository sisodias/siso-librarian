# Worklog: the hook crossed ten minutes and started timing out my own pushes

Two consecutive pushes died at the 10-minute mark. The third only landed because
I ran it in the background.

## The blind spot

`check-all.sh` reported **PASS/FAIL and no duration**. So when the hook got slow,
I could not say which suite had grown — the only way to find out was to re-run
each by hand.

That is a strange gap in a repo where nearly every other number is derived and
gated: the one cost that determines whether the gates get run at all was not
measured.

## The fix

Time every suite in the single `run()` wrapper they all pass through, and print
seconds on the **FAIL** line as well as the PASS line — a suite that fails slowly
is exactly the one worth knowing about.

## First measurement

| suite | time |
| --- | ---: |
| verify chain | 143s |
| gate self-test | 28s |
| retention self-test | 0s |
| rebuild self-test | 13s |
| **gates load-bearing** | **460s** |
| **total** | **644s** |

**Load-bearing is 71% on its own; verify is 22%. Together 92%.** The other three
suites cost **41s combined**.

The reason load-bearing dominates is structural: it replays the *entire* verify
chain once per gate, so every second added to the chain is multiplied by the gate
count. The chain grew as the corpus grew — 1,925 books now — and this suite paid
that growth nine times over.

## Deliberately not acted on

This is a measurement, not a fix. The number is now visible on every run, which
is the precondition for deciding whether to act on it. Acting first would mean
guessing which suite to cut.

The reason it matters: **a gate too slow to run is a gate that gets skipped**, and
that is exactly how the `--quick` skip list grew in the first place.
