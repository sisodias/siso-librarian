# Decisions and dead ends — the reasoning behind the artifacts

Written 2026-08-04. The repos show *what* was built. This is *why*, plus the
things we tried and rejected. Without it you will re-litigate settled questions
and re-walk paths that end nowhere.

---

## Decisions that are settled — do not reopen without new evidence

### Books live in Foundry, not in the Great Library

Foundry's own north star: *"one domain-agnostic intelligence engine that, for any
domain, scrapes the content, scrapes the people who make it, watches them over
time, then runs research over the curated result… build the loop once in core/,
and every new domain is an adapter, not a rewrite."*

Books is the **fifth instance** of that loop, not a new system. L1 (catalog) and
L2 (people) are built; L3 (watch) and L4 (research) are not.

The Great Library is a **catalog, not a warehouse**. Its own registry-model doc:
*"a mixed corpus does not become one Work merely because it has one path."* So
the corpus is registered as a **Source Inventory** with `data_or_archive` units —
referenced, never contained.

### The physical layout is deliberately undecided

Agents query the index and receive an address; they never navigate directories.
So the corpus can be repacked later without breaking a reference. Choosing a
layout now optimises for a usage pattern nobody has observed.

**Rejected: sharding by subject.** Measured 356× imbalance — P holds 56% of the
corpus at ~8.2 GB gzipped while V holds 126 books. Meaning-based location does
not distribute.

**Chosen: sequential fill by id.** Access is random — an agent wants one book or
a few dozen, essentially never a whole section — and a range read costs the same
in any asset. So the split can be arbitrary, and arbitrary is cheaper to maintain.

**Rejected: one repo per book.** GITenberg does this at 50,000 repos and it works,
but enumeration alone is ~200 h at 5,000 API req/h for a million repos. The index
already makes location a lookup, so per-book repos buy nothing.

### Per-file gzip inside uncompressed tars

The container stays uncompressed so byte offsets remain exact. Each book is
gzipped individually, measured 2.63×, so a fetch transfers ~170 KB instead of
~450 KB.

I originally framed this as "trade seek cost for size." **That was wrong** —
there is no trade. Fewer bytes, same request count, same seek cost, fewer assets.
Compressing the *container* is what would destroy random access.

`mtime=0` makes repacking deterministic, so a re-run produces byte-identical
assets and is verifiable rather than merely plausible.

### SHA-256 per book — a pinned edition, not a mirror

Shaan's concern: *"why should these books change? Books written a thousand years
ago shouldn't change."* Correct — but Gutenberg's *transcription* changes: typo
fixes, re-scans, edition swaps. Recording a hash per book turns silent drift into
a loud mismatch.

### Store evidence, derive verdicts

The single most transferable rule. A sibling system stored `tier` beside `score`
and drifted to **96.6% contradiction** — 4,995 pages labelled top-tier carrying
bottom-tier scores. Two writers, no arbiter.

So: no stored rank in the people graph. Identity matches are **claims** with a
method, confidence, and literal evidence — never silent merges. Merges are
reversible via `merged_into`.

### Roles live on the edge, not the person

Someone authored *this* and translated *that*. Flattening roles would make a
Gutenberg volunteer editor (David Widger, 289 "works") the second most prolific
author in history. That is a real record in this data, not a hypothetical.

---

## Dead ends — tried, measured, rejected. Do not repeat.

### Cross-domain identity stitch is structural, not fixable

Currently 5 people. **Not a matching failure.** 20,246 book people died before
1950; GitHub users are alive. There is no Spinoza with a GitHub account.
Realistic maximum ~419.

Retested at **172× the sample size — still zero new matches.**

I assumed resolving GitHub logins to real names would unlock mass stitching.
**Tested and false.** `real_name` from the GitHub API is frequently a project
name: `.NET Core Community`, `37signals`, `AFNetworking`, `0voice`.

Do not spend cycles here. The populations that *should* overlap are living
writers and podcast guests — sources not yet loaded.

### YouTube is not under-loaded

I flagged 132 edges as "absurdly low" for a whole domain. A sibling agent checked
the source table: **97 rows exist.** It is fully loaded. Chasing a YouTube loader
would have been pure waste.

### Applying the tier/score fix would make things worse

The fix exists as `fix_tier_score.py`, dry-run only, **deliberately unapplied**.
Deriving tier from score moves the distribution from 5,292 A / 1,647 B / 34 C to
**13 A / 6,970 B / 0 C** — 99.8% in one band. That trades a visible contradiction
for invisible flatness.

It needs a real scorer first. The curator's tier label is currently the *more*
trustworthy signal, because at least a human chose it.

### Embedding the whole corpus is arithmetically impossible

Measured on the mini's M4 with nomic-embed-text: **55.5 passages/sec**. All 41.5M
passages is ~8 days of continuous compute for a brute-force similarity index.

And claim extraction is worse: the 932-book philosophy shelf alone needs ~400M
tokens against a 150M budget — **267%**. The whole corpus needs **22,133%**. The
budget covers ~187,500 passages total.

This is why evidence selection must be question-driven. "Extract everything" is
not wasteful; it is impossible.

### The retrieval unit is probably claims, not passages

A paragraph is a chunk of text — not something you can agree or disagree with. A
**claim** is "Plato argues justice is intrinsic rather than conventional," with
passages as its evidence. Dozens per book, not 535.

Evidence Engines' `ingest-knowledge` already defines the contract: a claim, a
grounding quote, a confidence, a wisdom/opinion type. The estate decided this
unit already; the books work had drifted from it.

**Open question, genuinely unresolved:** extract claims per-book (comprehensive
but speculative) or per-question (cheap and always relevant, but the corpus stays
dark until asked)? Probably hybrid — extract per question, cache so the second
question about a book is free.

### `Issued` is not a publication date

It is Gutenberg's **digitisation** date. The Declaration of Independence reads
1971; the Gettysburg Address 1973.

An earlier pass concluded "zero periodicals pre-1950" and dropped a date filter
as a result. **That reading was wrong.** The century-old journalism Shaan wants is
in the corpus; `issued` simply cannot find it. Use **author life dates** — 27,583
people have them, BCE stored negative.

---

## What Shaan actually asked for that is still unbuilt

In his words: *"a system on the Mac mini with a URL I can view anywhere, showing
all the data buckets we have — how many repos analysed, all those stats — but
also the God Questions and which one's being worked on."*

The tunnel already runs on the mini and could serve it. Nothing has been built.
This is the most visible unbuilt thing and it would make everything else legible.

He also wants the agent to **max out the MiniMax plan**, noting it bills on a
percentage of a 5-hour window rather than tokens. No usage endpoint was found —
both `/v1/user/quota` and `/anthropic/v1/usage` return 404. Local telemetry
reports `0/150000000tok`, so something computes it; the source was not traced.

---

## The tier list, in his words

He was explicit about what matters, and the data showed his instinct was right:

**Take first:** philosophy/psych/religion, all history, social sciences, political
science, science, medicine, technology, education. Plus the cross-cutting picks —
**essays, letters and speeches** (he called this "god source"), century-old
journalism, mythology and folklore, biography, classical Greek and Latin,
literary criticism.

**Hold:** language, geography, agriculture, fine arts.

**Store but do not extract:** juvenile fiction (8,157 books), romance, music,
fashion, cookery.

The finding that vindicated him: **4,638 tier-1 books sit inside section P**, the
literature section he would have discarded. PN criticism and PA classical alone
are 1,751 of them. Section-level filtering would have thrown out Aristotle.

`tier_queries.sql` implements this — 19,532 rows, 17,750 distinct books, deduped
with a reason column.
