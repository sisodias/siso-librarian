
---

## Final: complete

The background fetch finished. **78 of 78 eligible identifiers, all on disk.**

| Measure | Value |
| --- | ---: |
| books | **78** |
| words | **11,542,686** |
| readable English | **78 / 78** |
| size on vault | **77 MB** |

By subject: 29 English poetry, 28 Essays, 21 Cookery.

**Every failure across every run was transient and mine.** Four identifiers
failed at some point; all four returned *exactly 170 bytes*, and all four
recovered. The clincher is `b2147171x`: declared 807,585 bytes, returned 170,
came back at **788 KB** on retry. Not one book was actually unavailable.

82 attempts produced 78 distinct files — the resume logic meant archive.org was
never asked twice for the same text.
