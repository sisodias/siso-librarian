# Worklog: a maxdepth became a claim

Date: 2026-08-04T17:14:36Z (generated filename)
Thread: decision 2

## What is genuinely Shaan's

Choosing a **target remote** for five backend commits that touch CAM4 VPS and
circuit-breaker logic. Pushing someone else's work somewhere is authority, not
technique. That half stands.

## What I could verify

The decision offered an alternative: *"or a decision that local refs plus the
vault bundle is sufficient."*

Sufficiency is a **measurable property**, and nobody had measured it.

```
local refs   5 under refs/rescue/ in SISO_Agency/apps/oracle-streaming
bundle       all 5 SHAs present in bundle history
             (fetched to a scratch repo, cat-file -e on each)
verify       "The bundle records a complete history."   621 MB
```

**The fallback holds.** Every rescue commit exists twice. So decision 2 is a
preference about a *third* copy, not a rescue — which is a much smaller thing to
ask someone to decide.

## The error I nearly published

My first search was:

```
find ~ -maxdepth 4 -name .git   ->  no rescue refs anywhere on the machine
```

`oracle-streaming` is at **depth 5**.

I was one keystroke from writing *"no rescue refs exist"* — a claim that the work
I had personally anchored yesterday was gone, based on a depth limit I chose for
speed.

**A maxdepth became a claim about existence.** The same shape as truncating a
rights string at 44 characters and inferring a licence: a display parameter,
silently promoted to a fact.

The tell both times was that the result was *too clean*. "Zero rescue refs
anywhere" and "72 items are CC-licensed" were both surprising enough to deserve
one more command, and both dissolved on the second look.

| Measurement | Value |
| --- | ---: |
| rescue refs found | **5** |
| present in bundle history | **5 of 5** |
| decision 2 shape | rescue -> **redundancy preference** |
| near-miss claims caught | 2 today |

Verify exit 0.

## Not resolved

Decision 2 stays open — I have narrowed what it is asking, not answered it. The
remote target is still Shaan's, and now he is choosing whether to add a third
copy rather than whether to save the work.
