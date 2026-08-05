# Worklog: the corpus checked against itself

Date: 2026-08-05T04:24:22Z (generated filename)
Thread: twelve turns of infrastructure, one of books

## The gap

The ingest dedups **candidates** by normalised title before fetching. Nothing
had ever verified that worked — and title matching is blind to the same text
arriving under a different title.

```
books                      179
passages fingerprinted  80,123
exact title duplicates       0
shared passages              3
```

## The three shared passages are quotation

I read them rather than flagging them:

| books | what |
| --- | --- |
| `b21471745` / `b21471848_0001` | a childcare passage quoted in two Victorian domestic-economy manuals |
| `johndonnehisflig00molo` / `metaphysicallyri00unse` | a Donne criticism passage quoted in two works on metaphysical poetry |
| `s1id13404340` / `s1id13404350` | two London Magazine volumes |

**A shared passage between related works is what a library should contain.** The
check reports them and does not condemn them, because deciding requires reading.

## Two near-duplicates, investigated

**Eight London Magazine entries** share a title prefix — different *years*
(1747, 1770, 1777…). Correctly held as separate volumes.

**The Gull pair**: `b21700849` is *medical papers*, `b21700850` is *memoir
and addresses*, with completely different opening text. Two books.

## A probe of mine that tested nothing

My first duplicate test ran the **query** against a copy — not the script. The
DB path was hardcoded, so the script could never see the fixture. Same defect as
the retention self-test that exercised sqlite instead of the thing it tested.

With a `CORPUS_DB` override it means something:

```
clean fixture              exit 0
duplicate title injected   exit 5
```

Verify exit 0. Suites 3 pass, 0 fail.
