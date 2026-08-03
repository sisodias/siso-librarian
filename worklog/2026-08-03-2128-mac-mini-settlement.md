# Worklog: Mac mini settlement survey

Date: 2026-08-03 21:28
Thread: Mac mini settlement / GQ-009 support
Proposal: `proposals/2026-08-03-mac-mini-settlement.md`

## What changed

Settled into the Mac mini operating environment and recorded a safe cleanup baseline. No files were deleted, no active databases were moved, and no vault corpus data was mutated.

Added:

- `proposals/2026-08-03-mac-mini-settlement.md`
- `metrics/2026-08-03-mac-mini-settlement.json`
- this worklog

## Before / after numbers

| Measurement | Before | After |
| --- | ---: | ---: |
| machine settlement metrics files | 0 | 1 |
| cleanup candidates recorded | 0 | 3 |
| local herdr verified | unknown | yes |
| laptop herdr verified | unknown | yes |
| MiniMax lean lane verified | unknown | yes |
| files deleted | 0 | 0 |
| active DBs moved | 0 | 0 |
| vault corpus mutations | 0 | 0 |

## Machine snapshot

- Host: `Shaans-Mac-mini.local`, macOS 15.5.
- Uptime: 13 days.
- Load averages during survey: 1.12 / 1.15 / 1.25.
- `/`: 228Gi filesystem, 27Gi available, 39% capacity.
- `/Volumes/SISO-STORAGE-VAULT`: 4.5Ti size, 745Gi used, 3.8Ti available.

## Channels verified

- Local herdr works; current librarian pane seen as `w65828adcf66b53-1`.
- Laptop herdr works over Tailscale SSH; three panes seen, including the known main-session hint `w658224a4ab3734-1`.
- Lean MiniMax lane works: `MINI_ENGINE=pi ~/bin/mini-pi -p 'Return exactly: mini-pi-ok'` returned `mini-pi-ok`.

## Largest internal-home usage observed

| Path | Size |
| --- | ---: |
| `~/SISO_Workspace` | 33G |
| `~/passages.sqlite` | 23G |
| `~/Pictures` | 11G |
| `~/Library` | 10G |
| `~/passages_v1.sqlite.gz` | 9.5G |
| `~/oracle-gate` | 8.5G |
| `~/foundry-data` | 6.7G |
| `~/.pi-lens` | 4.0G |
| `~/.ollama` | 2.6G |
| `~/.local` | 2.3G |
| `~/.config` | 2.3G |
| `~/tmp` | 939M |

## Cleanup candidates, not acted on

| Candidate | Size | Safe next action |
| --- | ---: | --- |
| `~/passages_v1.sqlite.gz` | 9.5G | Copy to vault, checksum, identify consumers, then quarantine/rename locally if safe. |
| `~/tmp/whisper_ep9kyxxk/ByjjZPvNn-Y.m4a` | 567M | Check references, then copy/quarantine if unreferenced. |
| `~/tmp/node-compile-cache` | 107M | Check active processes, then treat as cache cleanup candidate. |

## What I got wrong / what surprised me

The immediate high-value move was not deleting anything. The machine has enough vault space and enough internal pressure to justify cleanup, but the largest candidates include active or possibly important Library artifacts. The safe pattern is copy/checksum/quarantine, not removal.

A previous schema-hardening proposal was started before the goal shifted to Mac mini settlement. It remains useful as a future claim-layer loop, but this loop prioritized getting settled and mapping cleanup risk.
