# Worklog: I truncated a string and nearly cried wolf

Date: 2026-08-04T16:50:57Z (generated filename)
Thread: verifying the want-list before anyone acts on it

## The list is fetchable

Six identifiers sampled, **six with a DjVuTXT sidecar**. The adapter's quality
gate passes.

## Then the rights field turned out not to be one thing

```
dilip-simeon-closing-the-circle-...-2025
  date       2025-10-23
  rights     Public Domain License
  creator    Uploaded for the author by Harsh Kapoor, SACW.NET
  uploader   aiindex@gmail.com

poetsofchristian00batt
  date       1947
  rights     Copyright review: Public domain according to HathiTrust rights database
  sponsor    Princeton Theological Seminary Library
```

One is a **documented institutional copyright review**. The other is free text a
third-party uploader typed on a 2025 book. My contract recorded both as
*"advancedsearch rights:\"public domain\""* — identical evidence.

Fixed: the generator now records the rights **string** and classifies
provenance. That is mechanical, not a legal judgement.

## And then I nearly published a false alarm

Regenerating showed **72 of 106** items with rights beginning *"This work is
available under the Creative Co…"*.

I wrote — in my head, one keystroke from the metrics file — *"my public-domain
filter has been matching CC-licensed works."* That would have been a serious
finding.

The full string is:

```
This work is available under the Creative Commons, Public Domain Mark
```

**The Public Domain Mark is a CC designation for works already in the public
domain.** Not a restrictive licence. I had truncated the display at 44
characters and the words that changed the meaning were at position 60.

I read "Creative Commons" and inferred "licence" before reading to the end of
the sentence.

## The real distribution

```
72  Creative Commons, Public Domain Mark
25  Public domain in the USA.
 6  Copyright review: HathiTrust rights database   <- strongest
 1  Public Domain
 1  This work is now in public domain.
 1  Public Domain License                          <- the 2025 upload, weakest
```

**105 of 106 are genuine public-domain designations** of varying strength. One is
not a real designation at all.

| Measurement | Value |
| --- | ---: |
| items with DjVuTXT (sampled) | 6 of 6 |
| distinct rights strings | **6** |
| institutional review | 6 |
| items with no real designation | **1** |

Verify exit 0.

## What I would tell myself

Truncating output is how I read fast, and it is how I nearly reported that a
quarter of a corpus was mislicensed. The string was 69 characters. I displayed
44 of them and reasoned about the rest.
