# Worklog: the evidence was one ls away

Date: 2026-08-04T15:42:02Z (generated filename)
Thread: the sixth deferral

## What I wrote yesterday, about an hour ago

> Trigger 2: *"NOT EVALUATED — depends on Foundry/Knowledge exports outside this
> repo; no evidence either way."*

```
$ ls ~/foundry-data/research/
4 directories, one per question
each containing: answer.md, evidence.json
```

**That is a question-addressable export.** The deferral said no evidence either
way; the evidence was one `ls` away, on this machine, in a directory I have
queried repeatedly today for other reasons.

"Outside this repo" was doing the work — and it is not the same as "outside this
machine", which is not the same as "unavailable".

## Then the actual test

The trigger asks for an export *"that can **replace a manual evidence link**"*.

```
evidence.json   keys: question, slice, deep, calls, evidence
record keys:    relevant, patterns
has url:        no
has quote:      no
has citation:   no
```

**DOES NOT FIRE**, for a measured reason. The records are model-extracted
summaries. A claim packet grounding needs a byte range into a source that
resolves to its quoted text; `{relevant, patterns}` cannot supply one.

The structure is right — question-keyed, machine-readable, one directory per
question. What is missing is **addressability**: a source identifier and a
quotable span.

That is a far more useful answer than "not evaluated", and it names exactly what
Foundry would need to add.

| Measurement | Before | After |
| --- | --- | --- |
| GQ-009 triggers tested | 3 of 5 | **4 of 5** |
| trigger 2 status | not evaluated | **does not fire, measured** |
| deferrals tested | 5 | **6** |
| deferrals that survived intact | 0 | 0 |

Registry `12f4cc2`; verify exit 0.

## Six for six

```
C6 "do not touch"            -> "without copying first"
plist "malformed XML"        -> plutil says OK
"both one plist edit"        -> one is
"needs hardware"             -> stands, narrower
"blocked on a person"        -> 1 trigger of 5
"outside this repo"          -> four exports, on this machine
```

**Not one deferral has survived being tested.** Every one was true enough to
sound careful and wrong enough to stop work that could have continued. The
pattern is not carelessness — it is that "I cannot" is cheaper to write than "I
checked, and here is exactly how far it goes".
