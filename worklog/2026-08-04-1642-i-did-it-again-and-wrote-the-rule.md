# Worklog: I did it again, and wrote the rule

Date: 2026-08-04T16:42:25Z (generated filename)
Thread: the numFound generalisation

## Testing my own last sentence

I ended the previous loop with: *"IA's reported pool size is not the number of
distinct works, so **every earlier figure** in this thread using numFound was
inflated."*

```
subject                        numFound   unique   dup%
Science fiction                     535      462   13.6
Detective and mystery stories       128      128    0.0
English poetry                       92       92    0.0
Essays                               77       77    0.0
Cookery                              60       60    0.0
Historical fiction                   58       58    0.0
```

**Five of six have zero duplicates.** Only science fiction has any.

And its duplicates are real works appearing 2-3 times — *Sjambak*, *Solar
Stiff*, *Raiders Invisible* — repeated scans of pulp magazines, not an IA search
behaviour.

## Three loops, one error shape

```
overlap 97.5%            from science fiction alone   other subjects: 65-97%
"pessimistic bias"       from four subjects           fifth: overstated 3x
"numFound overstates"    from one pool                five of six: zero dups
```

**None was a measurement error.** Every number was correct for what it measured.
The failure is writing *"IA pools"* when I measured **one** pool — and it is
invisible to re-derivation, because the arithmetic checks out perfectly.

That is why my gates never catch it. They verify that recorded values match
sources; they have no opinion about the sentence wrapped around the value.

## Written into the charter

Next to the wrong-key rule, which is the same family:

> **State the conclusion at the scope you measured, not the scope you want.**
> Before generalising, ask: how many independent cases support this, and what
> would the second one have to look like to break it?

With all three instances as evidence, because the rule without them reads like
generic caution.

## And a figure the charter was still carrying

Line 69 said mini-pi costs *"~71 input tokens per call"* as fact. That is the
number I traced this morning to a **comment in mini-pi written by its author** —
no ~71-token lane exists in the gateway log. I corrected the claim and the
metrics file at 09:00 and left the charter, which is the document that actually
steers behaviour.

Now attributed.

| Measurement | Value |
| --- | ---: |
| pools with duplicates | **1 of 6** |
| dup rate where present | 13.6% |
| over-generalisations this session | **3** |
| charter figures corrected | 1 |

Escalation corrected in place; verify exit 0.
