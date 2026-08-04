# Worklog: fixing the class

Date: 2026-08-04T17:33:15Z (generated filename)
Thread: "I fixed an instance and not the class"

## Enumerated instead of waiting for the next one

Walk every list-valued field in the snapshot, check whether its contents appear
**above** the raw JSON dump:

```
awaiting_decision.items    rendered   (fixed last loop)
escalations.headlines      rendered   (fixed two loops ago)
active_questions           rendered
god_questions.questions    HIDDEN     7 questions, shown as "God Questions: 7"
```

**A third instance**, sitting in the same table. Every registered God Question
with its state, falsifier count and evidence gaps — published as the number 7.

Now a section listing each one.

## My detector was wrong first

It reported `escalations.headlines` as HIDDEN, which I had fixed two loops ago
and verified.

```
title:  "Librarian -> main: ~2 days of disk left..."
page:   "Librarian -&gt; main: ..."
```

**I compared raw text against HTML.** The `>` is escaped. Had I trusted it, I
would have "re-fixed" a working feature and reported a defect that did not
exist — the same shape as the truncated rights string, one loop later.

## The check is permanent now

`list-rendered-as-count` walks four fields and fails if any is published as a
bare count. Proven by deleting the God Questions section: exactly one finding,
naming that field. Restored: clean. **Self-test case 13.**

| Measurement | Before | After |
| --- | ---: | ---: |
| list fields rendered as content | 3 of 4 | **4 of 4** |
| class-level check | none | **1, covering 4 fields** |
| self-test cases | 12 | **13** |
| false negatives in the detector | 1 | 0 |

Verify exit 0; self-test 13/13.

## What changed in how I fixed it

Twice I fixed an instance and wrote that I had. The third time I enumerated —
one script, four fields, one gap — and then made the enumeration a gate so a
fourth cannot appear silently.
