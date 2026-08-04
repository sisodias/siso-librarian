# Worklog: the Library already answers it

Date: 2026-08-04T16:10:58Z (generated filename)
Thread: what the copyright deferral was hiding

## The sentence I stopped at

Last loop I moved the IA blocker from rights to selection and wrote:

> *"Choosing which of 270,049 the Library wants is a **curation decision**, not
> a legal one."*

True, and another place to stop. Curation by whom, on what evidence?

## The Library has been answering it all along

```
books.sqlite / book_subject, across all 77,540 books

  Science fiction              3,291
  Short stories                3,218
  Fiction                      1,959
  Adventure stories            1,642
  Historical fiction           1,080
  Detective and mystery         1,013
```

**What this Library collects is measurable.** Literary and genre fiction, and
emphatically not ephemera. I did not have to guess a preference or ask for one —
77,540 prior decisions are recorded in a table I backed up this morning.

## Applying it to the pool

```
Science fiction                535
Short stories                  455
Detective and mystery stories  128
Adventure stories               88
Historical fiction              58
                             -----
                             1,264
```

Sample titles: **Vulcan's Workshop**, **Wanderer of Infinity**, **Planet of
Dreams**.

Genre fiction. Not student newspapers. **The subject filter turns an unusable
270k pool into a targeted 1.3k one** — no rights judgement, no human-supplied
list, no contract change to the rights gate.

## Why this matters for decision 7

Shaan has been holding a decision with two live options: someone supplies a
curated identifier list, or sample relevance after fetch (which inverts the
contract's check-before-download design).

This is a third, and it uses evidence the Library already owns.

| Measurement | Value |
| --- | ---: |
| explicit-rights pool | 270,049 |
| after subject filter | **1,264** |
| reduction | **99.5%** |
| new judgements required | **0** |

Escalation updated; verify exit 0.

## Not built

The want-list contract takes **named identifiers**; this produces a **query**.
Wiring them is a real adapter change. And the dedup question should be settled
first — I learned this morning that 77,534 books have titles after all, which
makes title-aware dedup possible and my author-only check obsolete.

Two pieces of work, both nameable, neither started. That is a better place to
stop than "curation decision".
