# Sources — every access method, measured, with the traps

Written 2026-08-04. Only Gutenberg is loaded. This is the research for everything
else, so the next adapter is repetition rather than rediscovery.

Every number here was verified by a live call unless marked otherwise.

---

## The rule that reorders everything

**Prefer sources that are already text. OCR is a last resort.**

Measured on a real 342-page scan (Talbot, *The Holographic Universe*):
`pdftotext` yielded **3,707 words** — because the body is page images with a text
layer only on the front matter. The same book's Internet Archive OCR sidecar
yielded **131,713 words**. **35× more.**

PDF is a print format, not a text format. `probe_text_layer.py` samples 12 pages
across the body — deliberately skipping the first 5%, which is exactly where a
scanned book fakes having text — and returns TEXT / PARTIAL / OCR_REQUIRED with a
shell exit code you can gate a pipeline on.

---

## Ranked by (text quality ÷ effort ÷ legal risk)

### 1. Project Gutenberg — DONE

- Bulk catalog: `https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv`
  — 21 MB, **5 seconds**, 79,071 rows. Columns: `Text#, Type, Issued, Title,
  Language, Authors, Subjects, LoCC, Bookshelves`.
- Full plaintext: `https://www.gutenberg.org/cache/epub/feeds/txt-files.tar.zip`
  — **11,244,765,936 bytes**, refreshed weekly, unpacks to a 30.4 GB tar.
- Per-book: `https://www.gutenberg.org/ebooks/<id>.txt.utf-8` — clean UTF-8, 200.
- rsync mirror is live: `rsync -av rsync.ibiblio.org::gutenberg /dest`.
- Rights: **public domain in the US by construction.** Record as
  `public_domain_us`, never a blanket claim — other jurisdictions differ.
- Gutenberg explicitly asks consumers to use these bulk files *"instead of
  crawling or roboting the website."* The fast path is also the sanctioned one.

### 2. Internet Archive — THE NEXT ONE. 1.37M texts.

**The finding that makes this cheap:** every scanned item ships a pre-OCR'd
`_djvu.txt` sidecar. IA already did the OCR, years ago, for free.

- Metadata: `https://archive.org/metadata/<identifier>` — returns a `files` array;
  look for `format == "DjVuTXT"`. Sampled 12 top-downloaded 1890–1928 texts:
  **12 of 12 had one**, sizes 258 KB – 6.8 MB.
- Download: `https://archive.org/download/<id>/<url-encoded name>`
- Search: `https://archive.org/advancedsearch.php` with `q`, `fl[]`, `rows`,
  `sort[]`, `output=json` → `response.docs` and `response.numFound`.
- **Scale, verified live:** `mediatype:texts` = **51,423,878**. Filtered to
  `rights:public domain` = **1,367,711**. That second number is the one to use.
- **Quality must be gated.** IA's own docs warn OCR can be *"sub-optimal to
  unusable"* depending on script and language. English scans are good — *Wizard of
  Oz* gave 41,251 clean alpha tokens, zero non-ASCII noise. Non-Latin and DLI-India
  material is a large share of IA's holdings and is where it degrades.
- **Subject tags are folksonomy, not taxonomy.** A sample of 40 philosophy records
  returned `philosophy`, `indian philosophy`, `hindu philosophy`, plus `microfilm`,
  `trade journals` and `magazines` — format tags leaking into the subject field.
  So: query IA against a named want-list; never browse it by category.
- **Hachette v. IA (2024):** 500k+ commercially-available books were removed and
  copyrighted items are borrow-only under controlled digital lending. The
  `rights:public domain` filter is non-negotiable, not a nicety.

### 3. arXiv — LaTeX source, better than any PDF

- Bulk: S3 **requester-pays** (you pay AWS transfer):
  `s3://arxiv/src/ArXiv_src_YYMM_*.tar`, manifests at `s3://arxiv/{pdf,src}/*_manifest.xml`
- Source is *"mostly TeX/LaTeX with figures in tar.gz"* — the author's actual text
  with structure intact, strictly better than extracting from a PDF.
- OAI-PMH `https://oaipmh.arxiv.org/oai` is **metadata only**.
- Legacy API: **1 request / 3 seconds, single connection.**
- Metadata is CC0. arXiv is *"unable to grant others the right to distribute arXiv
  articles"* — link back, do not redistribute.
- Free mirror on GCS `gs://arxiv-dataset/`.

### 4. PubMed Central Open Access — structured JATS XML

- AWS S3, free public bucket: `s3://pmc-oa-opendata/`
- Per-article JATS XML, plain text, PDF. **FTP ends August 2026**; legacy files
  moved to `deprecated/` on 2026-04-13, and baseline bulk packages are
  discontinued going forward.
- Three licence groups — Commercial-Allowed, Non-Commercial, Other — and all three
  must be pulled to cover the subset. Licences vary per article.
- E-utilities: 3 req/s anonymous, 10 with an API key.

### 5. Smaller, high-density, openly licensed

- **Perseus (Tufts)** — Greek and Latin in TEI XML with morphological tagging,
  every word linked to a lexicon. Small by count, extraordinary by density. Bulk
  from their canonical-literature GitHub repos.
- **Liberty Fund OLL** — economics and political philosophy, clean edited HTML and
  epub. A few thousand titles: Smith, Mill, Hume, the Federalist.
- **Standard Ebooks** — ~1,480 beautifully produced books, CC0 markup. But bulk
  feeds are **gated behind Patrons Circle**, and there is a honeypot link that
  bans scrapers for 24 h. Per-book path only.
- **DOAB / OAPEN** — 100k+ open-access book records. OAI-PMH at
  `https://directory.doabooks.org/oai/`; metadata CC0 but **per-book licence
  varies** and must be checked per record.
- **Wikisource** — monthly XML dumps, enwikisource ~3.4 GB. Free to reuse, but the
  dumps are *"not backups, not consistent, and not complete."* Per-IP 3-connection cap.
- **University OAI-PMH repositories** — open by policy, born-digital so always
  extractable. A LUISS thesis probed TEXT, 12/12 pages, Word 2016 origin.

### 6. Dropped — do not spend time here

- **HathiTrust** — bulk scraping prohibited outright by its AUP. Only Hathifiles
  *metadata* is free; full-text datasets are approval-bound and non-commercial.
- **Books3 / The Pile** — defunct, removed for copyright, *"mostly pirated ebooks"*
  from Bibliotik. ~197,500 files. Historical reference only.
- **RedPajama v1** — books subset removed with Books3. v2 has no blanket data
  licence (Common Crawl ToU applies).
- **Anna's Archive** — adverse 2026 judgments, USTR Notorious Markets list. Legal
  status claims in circulation trace to Wikipedia rather than primary sources.
  Metadata index at most; never a content source.

**Common Corpus (PleIAs)** is the legitimate successor to the ML corpora: 2.27T
tokens with a **per-document licence field** you can filter on. Worth knowing, but
Gutenberg gives cleaner data with none of the ambiguity.

---

## GitHub as the distribution layer — measured, not assumed

Release assets are **not** counted against repository size. Verified across six
repos by summing `assets[].size` from the API against `repo.size`:

| Repo | Release assets | Git size |
| --- | --- | --- |
| electron/electron | **1,790 GB** | 205 MB |
| ollama/ollama | 925 GB | 88 MB |
| ggml-org/llama.cpp | 252 GB | 414 MB |
| godotengine/godot | 174 GB | 1,822 MB |
| obsproject/obs-studio | 119 GB | 80 MB |
| prusa3d/PrusaSlicer | 48 GB | 403 MB |

Most recent 100 releases only — the API pages at 100, so true totals are higher.

**Hard limits that are real:** 100 MiB file block (50 MiB warning), 10 GB repo
on-disk, 2 GiB push cap, **2 GiB per release asset**, 1,000 assets per release,
no documented cap on total release size. Electron and Ollama both pack right to
the 2 GiB asset ceiling — that is the working unit.

**HTTP Range returns 206** on both `raw.githubusercontent.com` and release-asset
URLs. Verified with a real fetch: 26,460 bytes out of a 1.77 GB asset returned a
complete 101,354-character book in **0.79 s**.

**The real constraint is request volume, not storage.** The acceptable-use policy
forbids *"excessive automated bulk activity"* with no published number. A few
thousand fetches a day is invisible. Cache locally.

**Prior art:** GITenberg runs **50,000 repos, one per book**, named
`Title-slug__<gutenberg_id>` — so their repos join directly to our `gid`. Proven
viable, but enumeration alone is ~200 h at 5,000 API req/h for a million repos.
It lags upstream (newest ~75,9xx against 79,000+) and is **not** Project
Gutenberg's own account.

---

## The awesome-list ecosystem — harvested, not yet joined

A sibling agent built `pipelines/github/awesome/`. Measured:

- **319,511 entries · 191,586 repos · 1,716 curated lists**
- **145,049 owners** with peer-validation counts in `owner_signal`
- `sindresorhus` cited by **579 independent lists**, one repo in 475 of them

The value is not scale — it is that inclusion is **editorial judgement**. Someone
read the repo and decided it belonged, and multi-list inclusion means several
maintainers concluded that independently. GitHub's own metadata carries no such
signal; stars measure popularity and age.

Its own recorded lesson: the first crawl followed only the seed list and produced
5,392 peer-validated repos. Widening to depth-3 plus topic search multiplied that
**5.3×** to 28,745. It flagged that as *"the one thing not to repeat."*

`load_curated_signal.py` loads this into the people graph. **It has only ever been
run against a stale local copy** (295 of 49,879 owners matched). Re-run it against
the real graph — most of those 49,584 should resolve.

`catalog_full.sqlite` (~143 MB) lives on the laptop at
`SISO_Research/siso-foundry/pipelines/github/awesome/` and is **not** on the mini.
