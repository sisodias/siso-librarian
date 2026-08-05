# Worklog: mechanising the unreachability pattern

Date: 2026-08-05T04:40:17Z (generated filename)
Thread: five things built and left unreachable

## Stop fixing it a sixth time

Outbox messages nothing surfaced. Corpus counts absent from the page that
reports the corpus. Search indexes nothing queried. A search CLI the page never
mentioned. A gate wired to nothing.

**Five, each fixed by hand after noticing.** The pattern is stable enough to
mechanise.

## What was already covered, and what was not

| | |
| --- | --- |
| scripts | `script-unreferenced` — checked: every script is reachable |
| gates | `gate-dropped-from-chain` |
| **pages** | **nothing** |

And a page is what all five failures actually were: something a person is
expected to read, with no path to it.

## The defect looking found

**`library.html` was linked from the observatory and linked nowhere itself.**
A reader who browsed to the corpus hit a dead end and had to edit the URL by
hand. Back-link added; round trip verified in both directions over the tailnet.

## The check

`audit-reachability.mjs` — every page reachable from the index, every page
links somewhere, no link to a missing page, and it refuses to report clean when
`public/` has no pages at all.

```
fixed tree            0 findings
tree before my fix    page-is-a-dead-end
```

## The mechanism worked this time

`audit-verify-chain` **flagged `audit-reachability.mjs` as
`gate-dropped-from-chain` before I wired it in.**

Last turn I had to notice `corpus-integrity.mjs` myself. This turn the repo
told me. That is the difference between a lesson and a mechanism — and it is the
first time this session a guard caught my omission instead of me catching it.

Chain: **10 gates, 0 findings**. Verify exit 0. Suites 3 pass, 0 fail.
