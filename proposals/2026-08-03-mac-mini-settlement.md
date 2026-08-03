# Proposal: settle the Mac mini and identify safe cleanup moves

Date: 2026-08-03
Thread: Mac mini settlement / GQ-009 support

## Gap

The charter says the Librarian is the persistent Mac mini agent, but the machine has not yet been mapped as an operating environment. Before cleaning the internal SSD, launching fleets, or moving Library artifacts, the safe first gap is a measured settlement survey: where data lives, what is mounted, what channels work, and which cleanup candidates are reversible.

This beats continuing claim-layer schema hardening for one cycle because the user's latest directive changes the immediate operating context: get settled in, inspect herdr, inspect the Great Library surroundings, and clean the home/internal SSD safely.

## Evidence

Measured on 2026-08-03:

- Host: `Shaans-Mac-mini.local`, macOS 15.5, uptime 13 days.
- `/`: 228Gi filesystem, 17Gi used by system snapshot view, 27Gi available, 39% capacity.
- `/Volumes/SISO-STORAGE-VAULT`: 4.5Ti, 745Gi used, 3.8Ti available.
- Local herdr: working; librarian pane visible at `w65828adcf66b53-1`.
- Laptop herdr over Tailscale SSH: working; three panes visible, including the known main-session hint `w658224a4ab3734-1`.
- Lean MiniMax lane: `MINI_ENGINE=pi ~/bin/mini-pi -p 'Return exactly: mini-pi-ok'` returned `mini-pi-ok`.

Top internal-home usage:

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

Largest obvious file candidates:

- `~/passages.sqlite` — 23G, important; do not move/delete without a copy and a consumer update plan.
- `~/passages_v1.sqlite.gz` — 9.5G, likely backup/export; candidate to copy to vault then rename locally only after checksum.
- `~/tmp/whisper_ep9kyxxk/ByjjZPvNn-Y.m4a` — 567M, likely temporary media; candidate to copy/quarantine, not delete.

## Proposal

Create a machine settlement metrics snapshot and worklog, then use that to drive future cleanup proposals. No deletion in this loop.

Safe cleanup policy for later loops:

1. Prefer copy-to-vault + checksum + rename/quarantine over deletion.
2. Do not move active databases (`~/passages.sqlite`, `~/foundry-data`, `/tmp/people_v2_gh.sqlite`) until consumers are identified.
3. Treat `~/tmp` and compressed backups as first cleanup candidates because they are reversible and non-runtime-looking.
4. Use mailbox/herdr only for decisions that require laptop-side action or architecture changes.

## Measurement expected to move

- machine settlement metrics files: 0 -> 1
- cleanup candidates recorded: 0 -> at least 3
- communication channels verified: unknown -> local herdr, laptop herdr, MiniMax lane verified
- deletion performed: 0 -> 0 by design

## What would prove this wrong

If a surveyed candidate is actually active runtime state, the cleanup plan must be narrowed before implementation. No candidate should be deleted based only on size.

## Non-goals

- Do not delete anything.
- Do not move active Library databases.
- Do not mutate vault corpus.
- Do not interrupt laptop panes via herdr for routine progress.
