# Worklog: five grades, not two

Date: 2026-08-04T16:53:58Z (generated filename)
Thread: fixing a classifier I had just called too coarse

## The binary I shipped an hour ago

```
institutional-review          6
unreviewed-or-user-supplied 100
```

I wrote that this *"lumps a CC Public Domain Mark together with free text an
uploader typed"* — and then moved on. It was one function.

## Five grades, from the actual strings

```
 72  formal-designation     Creative Commons, Public Domain Mark
 25  jurisdiction-scoped    "Public domain in the USA."
  6  institutional-review   Copyright review: HathiTrust, via Princeton
  2  bare-assertion         "Public Domain" / "This work is now in public domain."
  1  not-a-designation      "Public Domain License"   <- not a real thing
```

These grade differently and a consumer should be able to pick a threshold:

- **78 of 106** are institutional-review or formal-designation — the strongest
  subset.
- **105 of 106** are genuine public-domain designations of some kind.
- **1** is the 2025 third-party upload, now isolated by name rather than buried
  among a hundred.

The file carries the grades, the counts, and a note that this grades the
**evidence**, not the works. No copyright judgement — the distinction between
"Copyright review: …" and "Public Domain License" is textual.

## What it supersedes

My earlier caveat flagged **7 items dated post-1929** as the ones deserving
scrutiny. Year was a **proxy** for evidence quality, and a poor one: six of those
seven turned out to have the *strongest* provenance in the list — institutional
reviews by a university library.

The rights string is the direct measure. The year filter would have sent a
reviewer to check exactly the wrong six.

## The gate caught my own commit

```
10 ledger entries disagreed
trigger: "new evidence source"
commit:  0ed18b7 Build the want-list generator
```

Correct — adding a file under `sources/` is precisely what that trigger watches.
Re-derived grounding first (30/30), then re-checked.

| Measurement | Before | After |
| --- | ---: | ---: |
| provenance grades | 2 | **5** |
| strongest subset identified | no | **78 of 106** |
| items needing a human look | 7 (by year) | **1 (by evidence)** |

Verify exit 0.
