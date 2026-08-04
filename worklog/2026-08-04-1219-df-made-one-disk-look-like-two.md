# Worklog: df made one disk look like two

Date: 2026-08-04T12:19:29Z (generated filename)
Thread: the single-volume risk I named last loop

## Testing the thing I had only named

I ended last loop saying the vault is a single external volume and one dropped
drive takes all nine copies. Naming a risk is not addressing it, so I checked
whether a second copy was achievable.

**It is not**, and the reason each candidate fails is worth recording.

## Time Machine snapshots: same device

```
/Volumes/SISO-STORAGE-VAULT                    3.8Ti free
/Volumes/.timemachine/.../2025-09-21.backup    3.8Ti free
```

Two mounts, both showing 3.8Ti. `df` presents them as separate filesystems and
they are **the same physical disk** — `/dev/disk5s2` for both.

The identical free-space figure is the tell, and it is only a tell if you notice
that two independent volumes reporting the same number to the gigabyte would be
a coincidence. I nearly read this as "there is already a second copy target".

## The ssd-copy volume: the internal drive

`/Volumes/SISO-STORAGE-VAULT.ssd-copy-20260803` **looks** like a copy of the
vault on a separate SSD. It is `/dev/disk3s5` — `Macintosh HD - Data`, the disk
root runs on.

Copying the vault there would protect against nothing, and it cannot fit: 45 GB
needed against 18Gi free — the same 18Gi this whole disk thread has been about.

## Tailnet: all six peers offline

Same dead link as the mailbox. Not a storage problem, an availability one.

| Candidate | Free | Verdict |
| --- | ---: | --- |
| timemachine snapshots | 3.8Ti | same device as the vault |
| ssd-copy volume | 35 GB | the internal drive |
| tailnet peers | — | all offline |

## What I did instead of improvising

Nothing. This needs hardware Shaan controls.

The tempting move was to copy the vault to `ssd-copy` — it has "vault" in the
name, it shows 35 GB free, and a directory listing afterwards would look like
redundancy. It would be a second copy on the drive it is insuring against, and
it would not fit. That is worse than no second copy, because it would stop
anyone asking the question.

Escalated with the device paths, so the decision needs no re-investigation.

Verify exit 0.

## The honest position

**9 of 9 databases backed up, 1 of 1 volumes.** The first number is real work
and the second is the one that bounds it.
