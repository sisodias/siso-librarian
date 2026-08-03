# The vision — what tonight was actually about

Written 2026-08-04. The handover covers *what exists*. This covers *why*, and it
is the part that does not survive in a file listing.

---

## The thesis, in Shaan's words

> "The whole point of the Great Library of SISO is mapping out all the value on
> the internet."

Not storing it. **Mapping** it. The charter already says this:

> "The opportunity is not merely to train on it or store more of it. The
> opportunity is to ask consequential questions, find the strongest relevant
> evidence, reason beyond surface consensus, and convert the resulting
> understanding into systems that solve real problems."

Everything built tonight is in service of that sentence.

---

## The five ideas that actually matter

### 1. The index is the asset; the corpus is a cache

79,071 books is not the valuable thing — Project Gutenberg already has those, for
free, forever. The valuable thing is the **structure**: who wrote what, when they
lived, what it is about, and where the bytes are.

That is why the book library repo ships a 182 MB index in Git and pushes 10 GB of
payload to release assets. The index is small, irreplaceable, and ours. The
payload is large, replaceable, and a convenience.

Corollary that keeps being forgotten: **physical batching is deliberately
undecided.** Agents query the index and get an address; they never navigate
directories. So the corpus can be repacked later without breaking a single
reference. Choosing a layout now optimises for a usage pattern nobody has
observed.

### 2. Membership is a relation, never a folder

Measured: books carry **4.25 subjects each**, and **199 of 200** belong to more
than one shelf. Filing each under one directory throws away most of what the
catalog already knows.

So subjects are edge tables and a shelf is a saved query. This is why the tier
list works — Shaan said "literature, don't care," and the data showed **4,638
tier-1 books sitting inside section P**, the literature section. PN criticism and
PA classical alone are 1,751 of them. Section-level filtering would have
discarded Aristotle and the entire critical tradition.

**His instinct about misclassification was right, and it is quantified.**

### 3. People are the layer above every domain

> "This people graph will be on a level higher than GitHub, a level higher than
> books, a level higher than YouTube."

Correct, and the schema already anticipated it. Domains scrape content; content
is made by people; the same human is a GitHub login, a channel, an author name.

The membership rule Shaan chose is deliberately simple and worth preserving:
**you are in the graph if you produced something.** A book author is a
first-class member alongside a repo owner. Overlaps — someone who ships code
*and* writes *and* speaks — are the high-value cases.

280,722 people, 564,579 content edges, 2,450,492 topic edges across five
**deliberately separate** vocabularies. Never merge them: "python" and
"Philosophy, Ancient" are not the same kind of fact.

### 4. Store evidence, derive verdicts

The single most transferable lesson. A sibling system stored a `tier` alongside a
`score` and drifted to a **96.6% contradiction rate** — 4,995 pages labelled
top-tier while carrying bottom-tier scores. Two writers, no arbiter.

So the people graph stores no computed rank. Identity matches are **claims** with
a method, a confidence, and the literal evidence — never silent merges, because
two humans named "John Murray" would fuse and the graph would assert something
false forever. Merges are reversible via `merged_into`.

When a fix was proposed for the tier bug, it was **correctly not applied**:
deriving tier from score would move 96.6% contradiction to 99.8% of pages in a
single band. Trading a visible problem for an invisible one is worse. It needs a
real scorer first.

### 5. Questions before corpora

The constraint that reframes everything: **extraction does not scale.** Claim
extraction over the 932-book philosophy shelf alone needs ~400 M tokens against a
150 M budget. The whole corpus needs 22,133% of it.

That is not a budget problem to solve with more compute. It is proof that
"extract everything and index it" is *arithmetically impossible*, which makes the
question-first model mandatory rather than merely elegant.

GQ-009 already asks exactly this and is `active`. Tonight's work is that question
being answered by doing rather than designing.

---

## Where this is heading

Shaan's own description, which is the actual product spec:

> "A system on the Mac mini with a URL I can view anywhere, showing all the data
> buckets we have — how many repos analysed, all those stats — but also the God
> Questions and which one's being worked on. And an agent running 24/7 whose job
> is upgrading and improving the SISO Library / Foundry / people graph system.
> His own repo where he documents everything with timestamps. Basically the first
> agent of the Great Library — an agent managing and self-evolving it."

Three things in that, and they are not the same thing:

1. **An observatory** — one URL, data buckets and question states, viewable
   anywhere. The tunnel already exists on the mini and could serve it. Not built.
2. **A standing agent** — exists now as `librarian`, with a charter that
   explicitly permits it to write its own skills and edit its own charter.
3. **Self-evolution** — the part that is real only if the agent's proposals
   survive review. GQ-009 has a watch trigger for exactly this: *"a standing
   agent proposes a change and it survives independent review."*

The unglamorous next step is **more sources**, because supply is what makes the
questions answerable: Internet Archive's 1.37 M public-domain texts, arXiv LaTeX,
PMC JATS. The adapter pattern is proven — repetition, not invention.

---

## How to work with Shaan

- **Act, then report.** He would rather correct a wrong move than be consulted on
  a right one. Do not ask which gap to pick.
- **He will catch an unverified claim.** He asked "how can you prove it's
  MiniMax?" and the honest answer was that it was not — the banner was a label,
  the round trip failed. That instinct is right; meet it with evidence, not
  reassurance.
- **He thinks in systems and gets frustrated by tunnel vision.** When he says
  "you're getting sidetracked," he means the work drifted from value to
  plumbing. Zoom back out to the question being served.
- **Prose over bullet salad.** He consumes replies by voice.
- **Never delete.** Copy, rename, or propose. This is absolute.
