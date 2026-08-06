# Worklog: the one gate nobody could prove was load-bearing

## The situation

`gates-are-load-bearing` **excluded** `evaluate-refresh`, for a real reason: a
scratch copy has one synthetic commit touching every watched path at once, so all
triggers fire and every claim reads stale.

But the consequence had not been stated plainly. Its removal had **never been
tested**. It was the only gate in the chain with no evidence it does anything —
an exclusion is a permanent blind spot wearing the costume of a known limitation.

## The fix

Teach the gate to detect synthetic history **itself** and skip with an explicit
`SKIPPED, not passed` — exactly what `audit-asserted-numbers` was taught earlier
today. Then remove the exclusion.

Self-detection beats exclusion for a reason I proved by accident this morning:
**an exclusion list is a thing callers forget.** I forgot it, my new gate fired
44 times on synthetic history, and it cost a blocked push. A self-check travels
with the gate.

## Result

```
before:  9 load-bearing, 2 excluded
after:  10 load-bearing, 1 excluded
```

The remaining exclusion is `audit-verify-chain`, which detects **any** missing
gate and would therefore mask every other result — a sound reason, not a blind
spot.

| case | result |
| --- | --- |
| real repo | exit 0 |
| synthetic copy | skips explicitly, exit 0 |
| removed from the chain | chain fails — **PASS** |

The third row is what makes it work: removing the *file* breaks the chain
regardless of what the gate would have reported.

## A detail I nearly got wrong

I pinned `cwd: root` on the new git call only after noticing the neighbouring
call does. Without it the commit count would come from whatever directory
happened to be current — the gate would measure a different repository than the
one it is auditing.

## And the gate caught me on the way out

Running verify before committing, it reported:

```
metrics-untracked | metrics/2026-08-06-the-gate-nobody-could-prove.json
  Present on disk but not tracked by git — it would vanish from a fresh clone.
```

The metrics file for *this* worklog. Correct, and resolved by committing it.
