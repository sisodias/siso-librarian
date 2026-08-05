# Worklog: the builders had no tests

Date: 2026-08-05T07:01:18Z (generated filename)
Thread: three probes that measured my fixture instead of the thing

## The structural cause

Three times this session a probe tested a copy while the script under test read
a **hardcoded path** and used the real database. I noted it each time and moved
on. Measured properly:

```
scripts with hardcoded vault paths     8
overridable for testing                1   (corpus-integrity — the one I already fixed)
```

And a sharper finding underneath it:

```
scripts that BUILD the corpus          7
appearing in any self-test             0
in the verify chain                    1
```

**The gates check artifacts. Nothing checked the builders** — the passage index,
the modern index, the catalogue migration, the page, the ingester, the search
CLI. `rebuild-corpus.sh` carries three guards I wrote yesterday and never saw
fail.

## My first self-test reproduced the exact defect

Seven cases, all green. Then the test that mattered — **delete the pipeline and
re-run**:

```
4 passed, 3 failed
```

Three cases asserted sqlite behaviour. One asserted that **"--check changes
nothing"** — which passes handsomely when `--check` does not exist.

I wrote a self-test for the fixture-not-the-thing defect and put the defect in
it.

## Rewritten

Every case now invokes `rebuild-corpus.sh`, starting with a case that fails
loudly if the pipeline is absent rather than letting the rest run vacuously.

| | |
| --- | ---: |
| pipeline present | **7 passed** |
| pipeline deleted | **0 passed** (was 4) |

`check-all` now runs **four** suites, and the rebuild self-test gates every
push.

Verify exit 0.
