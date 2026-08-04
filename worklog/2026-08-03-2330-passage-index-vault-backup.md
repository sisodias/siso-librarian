# Worklog: passage index vault backup

Date: 2026-08-03 23:30
Thread: Passage index single-copy risk
Proposal: `proposals/2026-08-03-passage-index-vault-backup.md`

## What changed

The passage index now exists in two places. It was a single 23G file on the internal SSD, which the charter ranks as a top gap: a drive failure loses 41.5M passage locators that took real compute to build.

Copied `~/passages.sqlite` to the vault at
`/Volumes/SISO-STORAGE-VAULT/SISO-VAULT/librarian-vault/passage-index/passages.sqlite`.

The live database was neither moved, mutated, nor deleted.

## Before / after numbers

| Measurement | Before | After |
| --- | ---: | ---: |
| verified vault copies | 0 | 1 |
| source bytes | 24,253,587,456 | 24,253,587,456 |
| destination bytes | 0 | 24,253,587,456 |
| `/` available | 24Gi | 23Gi |
| vault used | 745Gi | 768Gi |
| live DB moved or deleted | no | no |

Transfer: `rsync -ah --partial --inplace`, 11m22s at 33.88MB/s average — consistent with the known USB 2.0 ceiling on this enclosure.

## Verification

Exit codes lie, so the claim rests on the artifact rather than the status.

SHA-256, both sides:

```
5cddf0c2d59be8d68f686f1518d5524b34f0aa0c9d4136d546b68502a950ad7a  /Users/shaansisodia/passages.sqlite
5cddf0c2d59be8d68f686f1518d5524b34f0aa0c9d4136d546b68502a950ad7a  .../librarian-vault/passage-index/passages.sqlite
```

Byte counts re-derived independently with `stat -f %z`: both 24,253,587,456.

Then the check that actually matters — is the copy a working database, or 23G of matching bytes that no longer opens? Opened read-only:

- `select count(*) from book_body` returned **77,540**, matching the source.
- A sample passage row read back cleanly: `gid=10000 seq=0 start=845 end=1312 chars=467`.

## What surprised me

Two process lessons, both about not blocking.

A `select count(*)` over the 41.5M-row `passage` table exceeded the interactive timeout on the live DB, so the baseline command had to be abandoned mid-loop. The fix was to verify durability by bytes and hash first — which is what durability actually means — and treat row counts as separately measured facts from earlier successful queries. On the vault copy, `book_body` (77,540 rows) is the cheap structural check; the 41.5M-row scan is not needed to prove the file opens.

The copy also dipped from ~35MB/s to ~9MB/s partway through and recovered on its own. `--partial --inplace` is the right call here: an interruption resumes rather than restarting an 11-minute transfer.

## Residual risk

The vault is one enclosure on USB 2.0 with SMART unreadable through the bridge, so this is redundancy, not archival durability. It removes the single-copy failure mode; it does not make the index published or offsite. Publishing remains open, and the committed `external-content FTS` fix should land before a rebuild-and-publish since it makes the artifact roughly 29% smaller.
