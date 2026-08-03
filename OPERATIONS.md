# Operations — the machine, the services, the traps

Written 2026-08-04. What runs, where, and every operational thing that cost real
time to learn. Read before touching infrastructure.

---

## The two machines

**Laptop** (`shaans-macbook-pro`, Apple M1, 8 cores) — where code is authored and
where the main session runs. Reachable from the mini as `ssh laptop`
(100.118.29.68 over Tailscale). Verified working.

**Mac mini** (`Shaans-Mac-mini.local`, Apple M4, **16 GB RAM**, macOS 15.5) — the
always-on machine. 228 GB SSD with **~30 GB free — watch this**. Reachable from
the laptop as `ssh mini-fast`.

**Never use `ssh mac-mini` for commands.** That host sets `RemoteCommand`, so any
remote execution fails with *"Cannot execute command-line and remote command."*
`mac-mini` is for interactive login only; `mini-fast` is the scriptable one.

**macOS has no `timeout` command.** Scripts written on Linux assumptions fail
with `command not found`.

---

## Services running on the mini

| Port | Process | What it is |
| --- | --- | --- |
| 8080 | `bifrost-http` | the gateway. Returns an **empty** `/v1/models` **by design** — that is not a fault. |
| 8081 | `node` | the model catalog shim (`~/.config/bifrost/claude-model-catalog.mjs`). This is what actually serves the model list. |
| 8789 | `go-llm-proxy` | the MiniMax provider proxy Bifrost forwards to. |
| 11434 | `ollama` | local models: `nomic-embed-text` (768 dims, **55.5 passages/sec**), `phi4-mini` (**35 tok/s**, ~7 s per passage for claim extraction). |

**launchd daemons:**
- `com.cloudflare.cloudflared` — the tunnel, survives reboots
- `com.siso.mount-vault` — unlocks and mounts the encrypted vault at boot,
  proven by unmounting and recovering
- `com.siso.model-catalog` — the shim, `KeepAlive` true

Note the shim binds **8081**, not 8082 as on the laptop. Anything pointing at
8082 on this machine is wrong.

---

## The vault

`/Volumes/SISO-STORAGE-VAULT` — 4.5 TB, **~3.8 TB free**, encrypted APFS.

- **USB 2.0, ~40 MB/s.** This is the single most important operational fact.
- **SMART is unreadable** through the USB bridge, so drive health is unknown.
  Nothing irreplaceable should live only here.
- It **re-locks on every unmount.** The passphrase is four spaces, stored in the
  System keychain, and `com.siso.mount-vault` handles it at boot.
- **A folder once squatted its mount path**, so the volume mounted as
  `SISO-STORAGE-VAULT 1` while everything writing to the clean path silently hit
  the internal SSD. That is how 12 GB ended up in the wrong place. If you ever see
  a ` 1` suffix, something is squatting the name.

**The rule that follows from USB 2.0:** transactional writes on the internal SSD;
bulk sequential artifacts on the vault. SQLite doing thousands of small
synchronous writes over that bus produced a genuine **disk I/O error at 500
books** during the passage build, while another job was also writing.

**`du -sh` times out** on large trees over this bus and returns empty — which
reads as failure when the copy actually succeeded. Verify with
`find <dir> -type f | wc -l` and `df` deltas instead.

**macOS TCC blocks removable-volume writes from SSH sessions** even with correct
ownership. Use `sudo` for vault writes.

---

## Data that exists only on the mini

| Path | What | Size |
| --- | --- | --- |
| `~/passages.sqlite` | 41,501,325 passages, 77,540 books | 22.6 GB |
| `/tmp/people_v2_gh.sqlite` | the working people graph | ~688 MB |
| `~/foundry-data/domains/people/people.sqlite` | **canonical** — single-writer, never write directly | 28.5 MB |
| `/Volumes/.../library/gutenberg/txt-files.tar` | the unpacked corpus | 30.4 GB |
| `/Volumes/.../library/gutenberg/locator.sqlite` | byte offsets + SHA-256 per book | 18 MB |
| `/Volumes/.../library/gutenberg/assets/*.tar` | 6 sealed release assets | 10.5 GB |

Backup of the graph before enrichment:
`/tmp/people_v2_gh.PRE-ENRICH-20260803-174831.sqlite`

**`~/passages.sqlite` is unpublished and exists nowhere else.** A drive failure
loses 41.5M passages. An external-content FTS fix is committed that makes a
rebuild ~29% smaller (~6.5 GB saved) — rebuild before publishing.

---

## herdr — the traps that cost time

**Always the absolute path:** `~/.local/bin/herdr`. Bare `herdr` is "command not
found" in non-interactive shells.

**Pane ids renumber** on every open and close. Never cache one across turns.
Re-resolve by durable **agent name** (`herdr agent get <name>`) or `pane list`.

**The Enter gets swallowed** in Claude and Codex panes. `pane run` sends text plus
Enter, but the Enter is frequently eaten and the message sits unsent. Protocol:
send → sleep 2 → read the pane back → `pane send-keys <id> Enter` if it is still
queued. **Confirmation is `agent_status` flipping to `working`, not the text
disappearing.**

**`/exit` destroys the whole workspace**, not just the pane. **`C-c` renumbers
panes and loses the brief.** To change a running agent's model, spawn a **new**
pane with `--model` and leave the old one alone. I learned both of these by
breaking things.

**`pane read --lines N` returns completely empty** when N is smaller than the
pane's viewport height. Always request a generous floor and trim locally:
`pane read <id> --source recent --lines 200 | tail -n 40`.

**An empty composer does not mean the message failed.** MiniMax is slow to first
token; the input had been consumed and was processing. I resent a brief twice
before checking `agent_status`.

**Never `herdr server stop`** — it acts ambiently and has killed live sessions.

Sessions on the mini: `default` (where the librarian lives), `jarvis` (running,
pre-existing, not ours), `shaan` and `siso-agent-base` (stopped).

---

## Model routing — the part that does not work

Chain: Claude Code → shim (8081) → Bifrost (8080) → provider proxy (8789).

Bifrost gates models through **virtual keys**. The laptop has one named *"MiniMax
Workers Key v2"* (`sk-bf-6fbeac48-…`) which routes to MiniMax — tested, returns
`"model":"MiniMax-M3"`. The mini has three (`CAM Key`, `PARSER Key`, `Mac Mini
SISO Agent Base`) and **none route MiniMax**. Every request returns *"no keys
found that support model: MiniMax-M3"*.

Fix: copy that virtual key and its provider-config mapping from the laptop's
`~/.config/bifrost/config.db` into the mini's. Tables `governance_virtual_keys`
and `governance_virtual_key_provider_configs`. Back up first; Bifrost auto-restarts
on kill.

Already done along the way: the stale API key in `config_keys` (provider_id 7) was
replaced with a working one. Backup at `config.db.bak-key-20260804`.

**A running Claude Code session cannot select a model added after it started** —
it captured `ANTHROPIC_BASE_URL` at launch. Use `claude --model "..."` when
spawning, not `/model` afterwards.

**Verify by round trip, never by banner.** The banner reads from a static catalog
and will happily display a model that does not route.

---

## Auth

- `gh` on the mini has **two accounts**: `Lordsisodia` and `sisodias`. Repos live
  under `sisodias`, so `sisodias` must be active — `gh auth switch --user sisodias`.
  A push failed with 403 for exactly this reason.
- **`Lordsisodia` repos are unreachable** from both machines. Everything was
  pushed to `sisodias` instead. That was a constraint, not a decision.
- MiniMax key at `~/.config/siso-secrets/minimax.env`, verified working on both
  machines. **It was pasted into a chat and should be rotated.**
- A **stale hook** referencing `~/Projects/youtube-ai-research/venv/bin/python`
  fired an error on every prompt. Removed from `UserPromptSubmit`.

---

## The lesson underneath all of these

**Exit codes lie. Verify the artifact.**

Three separate jobs reported success while producing nothing:
- a truncated `scp` exited 0 — caught by `gzip -t`
- a passage run reported success with **zero rows** — CRLF line endings, and a
  blank-line regex matching only `\n\n` finds nothing in `\r\n\r\n`. The
  single-file test had passed because that copy was LF.
- a publish logged `ALL DONE` after **every** upload failed with
  `release not found` — the mini was authed as the wrong GitHub account

And the worst failure mode of all: **a plausible wrong answer.** `ask.py` resolved
a stale graph from `/tmp` before the canonical one — same command, same minute,
35,834 people versus 280,722. The stale file was structurally valid, just months
old. Canonical paths must come first in any resolution order.
