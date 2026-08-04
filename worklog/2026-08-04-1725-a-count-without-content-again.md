# Worklog: a count without content, again

Date: 2026-08-04T17:25:53Z (generated filename)
Thread: getting the corrected queue in front of Shaan

## Four loops of corrections, invisible

I spent four loops making the decision queue accurate. Then I checked what the
observatory actually shows:

```
Awaiting your decision   5
```

A number. **None of the five headlines.**

Splitting `index.html` at "Raw snapshot" proves where they were:

```
"12-95% saving" in readable page:   False
"12-95% saving" in raw JSON dump:   True
```

Buried in a `<pre>` block at the bottom that nobody scrolls to.

## Why this specifically matters

**Zero working push routes.** The observatory is the only channel that reaches
Shaan. It was reporting a count of things I had just corrected without showing
what they now say — he would read "5" and learn nothing about the 4.68 GB/day,
the 3.7% scope fix, or the want-list that resolved decision 7.

Fixed: a **"Decisions waiting on you"** section listing each headline. Verified
both ways — struck every heading through and the section disappears rather than
rendering an empty box; restored and it returns with the count back to 5.

## Second instance of the identical defect

Two loops ago I found exactly this for escalations: the page showed *"3 queued"*
and none of their content. I wrote the fix, wrote a worklog about counts not
being messages — and **did not check the feature directly beside it**, which had
the same shape.

```
escalations        count rendered, content in JSON   fixed two loops ago
awaiting_decision  count rendered, content in JSON   found today
```

I fixed an instance and not the class. The adjacent row in the same table, built
by the same function, with the same defect.

| Measurement | Before | After |
| --- | --- | --- |
| decision headlines on the page | **none** | all 5 |
| where they lived | raw JSON | readable section |
| sections hiding when empty | 1 | **2** |

Self-test 12/12; verify exit 0.
