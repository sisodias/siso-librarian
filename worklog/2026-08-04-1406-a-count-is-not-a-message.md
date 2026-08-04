# Worklog: a count is not a message

Date: 2026-08-04T14:06:01Z (generated filename)
Thread: three escalations, zero delivery

## The gap I had built myself

```
Escalations queued  3 · 3 readable on remote · oldest 8.1h
escalation TEXT on the page: False
```

The observatory reported **how many** messages were waiting and **none of what
they said**. With zero working push routes it is the only channel that reaches
Shaan — and I had put a counter on it.

Reading that row tells him a number. To learn that one of the three says
*"~2 days of disk left"* he would have to know to open `outbox/` on GitHub.

I built the counter two loops ago and was pleased with it, because it corrected
an earlier error where I claimed messages were undelivered when they were on the
remote. Correct, and still nearly useless.

## Fixed

The page now carries a section — **"Escalations you have not seen"** — listing
each message's headline and path:

```
Librarian -> main: ~2 days of disk left, and 91% of it is me (decision 6)
  outbox/2026-08-04T0553-librarian-disk-growth.md
```

Tested both directions rather than only the happy one: with `outbox/` emptied
the section **disappears** instead of rendering an empty box, and it returns
when the messages are restored. All three files put back and verified.

A permanently-present empty section is the kind of furniture people learn to
skip, which would undo the point.

## Why this counts as delivery work

I have written *"zero working push routes"* in several worklogs as though it
were a fact about the network. Part of it was a fact about my page: the pull
channel worked the whole time and I was under-using it.

The peers are still all offline — I rechecked, six of six, ping 100% loss. That
part is genuinely hardware. But the difference between "3 queued" and "3 queued,
here is the urgent one" is entirely mine, and it took two loops to notice.

| Measurement | Before | After |
| --- | ---: | ---: |
| escalation count on the page | yes | yes |
| escalation **content** on the page | **no** | **yes** |
| section hides when queue empties | n/a | verified |
| peers reachable | 0 of 6 | 0 of 6 |

Verify exit 0; self-test 12/12.
