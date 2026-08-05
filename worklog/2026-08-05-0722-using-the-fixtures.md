# Worklog: using the fixtures I made possible

Date: 2026-08-05T07:22:08Z (generated filename)
Thread: seven testable builders, none tested

## The gap I left open

Last turn I made seven builders overridable and **tested none of them**. The
rebuild self-test still asserted that guard **strings** appear in the source —
four of seven cases were `grep`, which passes if the guard is a comment.

That is prose-satisfying-a-check, the defect I have hit five times.

## Behaviour, against a real fixture

```
index builder indexes exactly the fixture's 2 books
the real index is untouched (334 books)
modern-spelling builder adds passage_modern to the fixture
search answers from the fixture index
```

**The "untouched" case matters most.** A builder that ignores `VAULT_ROOT` and
writes to the real vault is precisely the defect this session kept hitting — so
the test now asserts the real index still holds 334 books after a fixture run.

## Proven on real breakage

| broken thing | result |
| --- | --- |
| pipeline deleted | **0 passed, 2 failed** |
| index builder made to exit early | **"got 0 books, expected 2"** |

That second one is the silent-failure shape that let **34 books go
uncatalogued** two turns ago — a builder producing nothing while reporting
success.

## A defect I nearly recorded that did not exist

Search found nothing for **"poem"** in two poetry books. Before adjusting
anything I checked: **"poem" appears zero times in their text.** They *are*
poems — the word is in the title, not the body. Searching "the" returns a hit
immediately.

**The test was wrong, not the search.**

8 passed, 0 failed. Suites 4 pass. Verify exit 0.
