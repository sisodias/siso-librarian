# Worklog: 927 books, and a duplicate that was not one

Date: 2026-08-05T15:26:02Z (generated filename)
Thread: the sixth want-list

## The Library

| | |
| --- | ---: |
| books | **927** |
| passages | **1,284,225** |
| words | **111.8M** |
| long-s passages | 362,277 |

**150 of 150 fetched on the first pass** — no `BAD_BODY` failures at all,
a first across six want-lists.

## The first exact title duplicate in 927 books

`corpus-integrity --strict` exited **5**. The gate fired exactly as built.

But the duplicate is not duplicated content:

```
Annual report of the progress of chemistry and the allied sciences...
  s1id13378210   2,201 passages   1.9 MB
  s1id13378220   2,483 passages   2.2 MB
```

Different opening text. **Two years of an annual serial**, colliding because IA
**truncates long titles** and the volume distinction falls off the end.

## Two fixes

The report now prints **passage counts alongside the title**, so a reader can
distinguish a truncated serial from a real duplicate without querying anything.

And `--strict` fails on identical **content** — matching passage counts — not
identical strings.

Proven both ways rather than assumed:

```
truncated serial   2201,2483   exit 0
injected duplicate  459,459    exit 5
```

**A gate that fails on a metadata artefact teaches me to bypass it.** That is
the same reasoning as the sliding-window derivations and the live-check
warnings.

## And the guard from earlier held

The modern-spelling index reported **"passage_modern complete: 1,284,225 rows"**
— the completeness check I added after it silently stopped at 334,000. The
bounded cache and rowid paging carried it through 1.28M passages without a
crash, where it had died twice at ~940,000.

Verify exit 0. Suites 4 pass, 0 fail.
