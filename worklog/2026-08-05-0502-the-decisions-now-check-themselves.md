# Worklog: the decisions now check themselves

Date: 2026-08-05T05:02:06Z (generated filename)
Thread: the gap I named last turn and left standing

## Naming a gap is not closing one

Last turn I wrote: *"nothing re-derives decision numbers automatically. Metrics
files have a gate; the prose that asks for Shaan's attention does not."*

Then I stopped — the move I have corrected **four times** this session.

**A stale decision is worse than a stale metric.** A stale metric misleads me. A
stale decision spends *his* attention on something already done, and both stale
entries were found by hand, one turn apart.

## The queue already asserted testable facts

| decision | claim | re-derived from |
| --- | --- | --- |
| 1 | the MiniMax route is NOT applied | the live shim's `upstream` line |
| 2 | 5 refs under `refs/rescue/` | `git for-each-ref` in the source repo |
| 4 | the observatory answers 200 on 8765 | live curl |
| 8 | 13.7 GB reclaimable | `du` over both locations |

All four hold today: **upstream is Bifrost, 5 refs, HTTP 200, 13.7 GB.**

## Two rules that keep it honest

**Live checks are warnings, never failures.** cloudflared being restarted is not
a stale decision. Only a number that contradicts what the decision *claims* is a
finding.

**It refuses to report clean when it verified nothing.** If every check mapped to
a closed decision it would silently pass — so it reports
`no-decision-claims-checked` instead. Proven by striking every heading:
`claims_verified: 0`.

Contradiction proven too: pointing check 1 at the wrong pattern gives **exit 7,
`decision-claim-contradicted`**.

## The mechanism caught me again

`audit-verify-chain` flagged `audit-decisions.mjs` as
`gate-dropped-from-chain` **before** I wired it in — second turn running.

That is what a mechanism does that a lesson does not.

Chain: **11 gates, 0 findings.** Verify exit 0. Suites 3 pass, 0 fail.
