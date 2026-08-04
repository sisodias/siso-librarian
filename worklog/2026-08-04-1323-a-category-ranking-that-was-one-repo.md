# Worklog: a category ranking that was one repo

Date: 2026-08-04T13:23:31Z (generated filename)
Thread: GQ-005's second axis

## The join that should have worked

`awesome_sections` failed as a categories axis — 10,185 of 28,177 sections were
singletons and the dense head was language names. But `identity.sqlite` holds a
**real** curated taxonomy, and `momentum.sqlite` holds a **real** three-day time
series. Joined:

```
repos in both: 55,467
```

That is the categories x time axis GQ-005 has been missing.

## The ranking it produced

```
slug                    repos   gain   per_repo
agent-extension-pack      585   1207      2.063
llm-app-framework         425    829      1.951
agent-platform            429    241      0.562
awesome-list            2,622    107      0.041
corpus baseline                           0.045
```

Agent infrastructure on top, 46x the baseline. It reproduces the ordering the
**disputed** GQ-005 claim asserted — the one whose counts matched no database.

I nearly wrote that up as a vindication.

## The column that killed it

```
agent-extension-pack   585 repos   1,207 stars gained   movers: 5
```

**Five.** Of 585. And within those five:

```
DeusData/codebase-memory-mcp   1112
github/github-mcp-server         47
GLips/Figma-Context-MCP          17
googleapis/mcp-toolbox           17
awslabs/mcp                      14
```

**92.1% of the category's entire gain is one repository.** Remove it and
agent-extension-pack falls to ~0.16 per repo — below several categories it
"leads", and barely above the 0.045 baseline.

The whole corpus has **29 movers across three days**. Any category ranking built
on that is reporting which category happened to contain the one repo that had a
good week.

## Why I am recording this rather than the ranking

"Agent infrastructure leads at 2.06 stars per repo" is arithmetically true and
substantively false. It would have been the strongest-looking finding I have
produced for GQ-005, and it would have been a claim about `DeusData/codebase-memory-mcp`
wearing a category's name.

The disputed claim asserted this ordering from evidence that did not exist. I
have now reproduced the ordering from evidence that does — and shown the ordering
itself is an artifact. **Getting the right-seeming answer from real data is not
the same as the answer being right.**

| Measurement | Value |
| --- | ---: |
| repos joining momentum to taxonomy | 55,467 |
| apparent leader, per repo | 2.063 |
| movers behind it | **5 of 585** |
| share from one repo | **92.1%** |
| corpus movers in 3 days | 29 |

Registry updated (`6432fe4`); verify exit 0.

## What would fix it

More observation days, not a different source. The taxonomy is sound and the
join works — three days is simply too short a window for star counts to move on
55,467 repositories. That is a data-collection gap, and momentum.sqlite stopped
recording on 2026-07-11.
