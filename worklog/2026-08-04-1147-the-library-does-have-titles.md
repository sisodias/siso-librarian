# Worklog: the Library does have titles

Date: 2026-08-04T11:47:32Z (generated filename)
Thread: backing up the file I called low-value

## What I expected to find

`books.sqlite`, 0.17 GB, the file I named as next *"since no claim cites it and
I do not know what it holds."* I expected a small auxiliary table and a two-line
worklog.

```
book            79,071
book_field     711,639
book_subject   184,624
book_shelf     206,269
book_class      82,405
subject_facet   85,855
```

It is the **bibliographic catalogue** — more books than the passage index has
bodies (77,540), with subjects, shelves and classifications. Backed up and
verified: `quick_check ok`, all sampled tables MATCH.

## The finding that matters more than the backup

`book` carries `gid, title, authors, language, issued, rights` — and `gid` is
the **same key** the passage index uses.

```sql
select count(*) from book_body b join c.book k on k.gid = b.gid;
-> 77,534   (of 77,540)
```

```
1 | The Declaration of Independence of the Unite | Jefferson, Thomas, 1743-18
3 | John F. Kennedy's Inaugural Address          | Kennedy, John F.
```

**The Library has titles for 77,534 of its 77,540 book bodies.** I have written
the opposite, in code, and built on it:

> `scripts/ia-dedup-check.mjs`:
> *"The Library has no titles on its book edges, so title matching is
> unavailable and this is the strongest signal on disk."*

That comment justifies falling back to **author-level** dedup for Internet
Archive candidates — a deliberately weaker check, chosen because I believed the
stronger one was impossible. It was not impossible. It was one `attach` away.

## Why I did not just implement it

Title matching needs normalisation — subtitles, editions, leading articles,
"Vol. II" — and I have watched myself write four plausible-looking normalisers
this session, one of which invented 25 phantom orphaned works. Doing it properly
means measuring the match rate against known duplicates, not writing a
`replace()` chain and declaring victory.

So: comment corrected with the evidence, finding recorded, implementation left
undone and stated as undone.

| Measurement | Value |
| --- | ---: |
| books in the catalogue | 79,071 |
| book bodies joining to a title | **77,534 of 77,540** |
| databases with a verified vault backup | 2 -> **4** |
| false premises found in my own code | 1 |

Verify exit 0.

## What this says about the other twelve

I called this file low-value because no claim cites it. That reasoning was
backwards: **nothing cites it because I did not know what was in it.** The other
twelve unbacked databases have exactly the same status, and I have no better
basis for ranking them than I had for this one.
