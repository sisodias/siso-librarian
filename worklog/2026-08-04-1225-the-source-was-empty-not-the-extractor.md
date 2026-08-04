# Worklog: the source was empty, not the extractor

Date: 2026-08-04T12:25:27Z (generated filename)
Thread: gid 4715, and whether it is alone

## I blamed the wrong layer

Last loop I called gid 4715 *"an extraction failure, isolated to one book"* and
deferred it as not worth touching the corpus. Half right.

I fetched the source instead of assuming:

```
https://www.gutenberg.org/ebooks/4715.txt.utf-8
  -> 302 -> cache/epub/4715/pg4715.txt   20,054 bytes

START marker   line 27
END marker     line 31
bytes between  4
```

**The upstream file is a title, a licence, and no book.** Four bytes between the
markers. Our extractor recorded 8 bytes and zero passages, which is the
*correct* result for that input.

Not our failure. Re-running our extractor against that URL would produce the
same 8 bytes forever — which is exactly what "recorded with the URL so it takes
one command" would have led someone to do.

## The text is not lost

```
pg4715-images.html   430,508 bytes   the full novel
```

The HTML edition has it. Only the plain-text rendering is empty, so the gap is
recoverable from a different source — a different parser and a write to the
passage index, which is C6 territory and not mine to do.

## Then the harder question

If one Gutenberg text file is empty upstream, how many others?

```
under 100 bytes        2
under 2 KB           157
under 10 KB        1,129
total             77,540
```

I tested a second: gid 9320, *"A Doctor of the Old School — **Complete**"*, 75
bytes locally. Upstream: **66 bytes between markers**. Same defect.

Two for two.

## What I did not conclude

**157 books under 2 KB is not 157 defects.** The same sample contains *"Hark!
The Herald Angels Sing"* at 106 bytes, which may be genuinely complete — a carol
is short.

Two confirmed cases establish the defect is real and not unique. They do not
establish a rate, and reporting "157 possible" as though it were a finding would
be the kind of number that gets quoted back without its caveat.

Settling it means 157 fetches comparing bytes-between-markers to local body
size. Bounded, cheap per item, and worth doing deliberately rather than as a
side effect of investigating one book.

| Measurement | Value |
| --- | ---: |
| gid 4715 upstream body | **4 bytes** |
| gid 9320 upstream body | **66 bytes** |
| suspects tested | 2 of 157 |
| defects confirmed | 2 |
| rate established | **no** |

Verify exit 0.
