# Worklog: the graph had no backup at all

Date: 2026-08-04T11:18:14Z (generated filename)
Thread: what else is unprotected

## The gap

I have spent loops verifying the vaulted passage index to 0.6%. Then I checked
what else was on the vault:

```
bifrost-logs  gap4-gap7  oracle-gate-diffs  passage-index
passages-v1-archive  pi-lens-history
```

**No people graph.** 1.09 GB, 280,722 people, 2.5M topic edges — the graph that
**six of my claims ground in** — had no copy anywhere. I had been carefully
measuring the backup of one artifact while the other had none.

## Backed up correctly

The graph is **WAL mode with live sidecars**, so `cp` would produce a torn file.
`sqlite3 .backup` instead, then verified rather than trusting exit 0:

```
pragma quick_check          ok
header write_version        2   (WAL — needs immutable=1 to read back)
person                      280,722    MATCH
person_content              564,579    MATCH
person_topic              2,555,047    MATCH
external_ids                845,004    MATCH
identity_claim                    6    MATCH
```

At 1.09 GB whole-table counts are affordable, so this needs no banding — every
table compared in full, unlike the 24 GB index.

The `write_version 2` also vindicates the `immutable=1` fix: without it this
backup would have been unreadable the moment I tried to verify it.

## A number I have been getting wrong in prose

`person_content` holds **564,579** rows. I have written "463,230 content edges"
repeatedly — that is the **GitHub-domain subset**, not the graph.

The observatory published 564,579 correctly the whole time. The error was only
ever in my prose, where I quoted a filtered count as though it were the whole
table. Corrected in the metrics file with the reason.

## A masking bug I introduced and caught

Extending the verifier, I put the passage-index `exit 8` before the new graph
block. A passage-index failure would have **skipped the graph check entirely** —
one artifact's problem hiding another's, which is precisely the defect this
script exists to surface.

Both results are now recorded and reported before any exit. Proven: with the
passage index unreadable, the graph still reports 5/5 and the exit is still 8.

| Measurement | Before | After |
| --- | ---: | ---: |
| Library artifacts with a vault backup | 1 of 2 | **2 of 2** |
| graph tables verified | 0 | **5 of 5, in full** |
| prose edge count | 463,230 (subset) | **564,579** |
| failures that can mask another | 1 | 0 |

Verify exit 0.

## Still unprotected

`~/foundry-data` is 7.6 GB and I have now backed up 1.09 GB of it. The books
domain and the rest of the identity data are unexamined — I checked one thing,
found it missing, and fixed that one thing rather than surveying the whole
directory.
