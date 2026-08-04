# Worklog: nothing on the vault is reachable from launchd

Date: 2026-08-04T13:39:06Z (generated filename)
Thread: the nine untraced runtime failures

## Two traced, and they rhyme

Of the nine, exactly **two touch `/Volumes`**. Both fail. For different reasons.

**`com.siso.agentbase`** (exit 7):

```
Error: EPERM: process.cwd failed with error operation not permitted, uv_cwd
wd: /Volumes/SISO-STORAGE-VAULT/SISO-VAULT/agentbase
```

The directory **exists**. My shell `cd`s into it and `pwd` succeeds. The
difference is that **launchd agents do not inherit Full Disk Access**, which
macOS requires for external volumes. A permissions boundary, not a missing file
— and invisible to every check I had written, since all of those test whether a
path exists.

**`com.siso.property-classq`** (exit 2):

```
can't open file '/Volumes/SISO-STORAGE-VAULT 1/SISO-VAULT/property/scripts/classq_collector.py'
```

**`SISO-STORAGE-VAULT 1`** — with a space and a "1". A macOS remount artifact:
when a volume mounts while an old mount point is still held, the new one gets a
number. The job's path was frozen against that transient name.

The numbered mount is gone. **The script exists at the real path.** This is the
only job in all 36 where nothing is lost and the fix is deleting two characters.

## Why I checked my own jobs next

Two of two vault-touching jobs fail, for two unrelated reasons. That is a
statement about the vault, not about those jobs — and **the vault holds every
Library backup I made this session**.

```
com.siso.librarian-mailbox   exit 0   touches /Volumes: no
verify-vault-backup.sh       touches /Volumes: YES
```

My mailbox drain is safe. But `verify-vault-backup.sh` reads the vault, and if
anyone schedules it under launchd it will hit the same EPERM and report the
backup **unreadable** — firing the exit-8/9 alarms I built for genuine
corruption, on a healthy vault.

Documented in the script header rather than discovered later by whoever
schedules it.

| Measurement | Before | After |
| --- | ---: | ---: |
| runtime failures traced | 1 of 10 | **3 of 10** |
| vault-touching jobs | 2 | 2, both failing |
| jobs where nothing is lost | 0 | **1** |

Verify exit 0; vault verifier still 5/5 and exit 0.

## A pipe hid a status again

`bash script.sh 2>&1 | tail -3; echo $?` printed an **empty** exit code, and I
re-ran unpiped to get the real 0. Third time this session: once on `| tail` with
the vault verifier, once on `| head` masking a SQL syntax error as an empty
result, and now this.

I keep writing the pipe because I want to see the output. The habit that saves
me is going back for the status when it looks wrong — not remembering in advance.
