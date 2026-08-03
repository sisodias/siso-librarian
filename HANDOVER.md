# Handover — Great Library, mini setup, MiniMax routing

Written 2026-08-04 by the laptop main session. Everything here was measured, not
assumed. Where I got something wrong, it says so.

---

## 1. What is DONE and verified

**Five public repos under `sisodias`** (not `Lordsisodia` — the CLI is authed as
`sisodias` and the old org is unreachable from these machines):

| Repo | State |
| --- | --- |
| `siso-book-library` | 79,071 works. `index-v1` + `payload-v1` (6 assets, 10 GB). Verified: downloaded clean, queried, and fetched a book by byte range. |
| `siso-people-graph` | 280,722 people. `graph-v1` release, 210 MB, verified by clean download + query. |
| `siso-foundry` | books domain, people graph v2, `ask.py`, packer, locator, passages, enrichment loaders, architecture docs. |
| `great-library-of-siso` | registry. Gutenberg Source Inventory registered. `npm run verify` passes. |
| `siso-librarian` | the standing agent's repo. Charter + worklogs. |

**The retrieval chain works end to end.** `gid 84` → locator → one HTTP Range
request → 26,460 bytes → a complete 101,354-character book in **0.79 s**, from
any machine, no local corpus, no auth. Proven against the live release.

**On the mini:** Cloudflare Tunnel as a launch daemon; vault auto-mount daemon
(proven by unmounting and recovering); model catalog shim on **8081** as a launch
daemon; passages built (41,501,325 across 77,540 books).

---

## 2. What is RUNNING right now

| Agent | Where | Model | Doing |
| --- | --- | --- | --- |
| `librarian` | mini pane `w65828adcf66b53-1` | Opus, `/goal` active | reasoning lane. Shipped claim packet contract, question portfolio index, refresh ledger. |
| `librarian-mm` | mini pane `w65828adcf66b53-2` | **claims** MiniMax, actually Anthropic — see §3 | machine hygiene: worktrees, unpushed work, reclaimable space. |
| `graph-enrich` | laptop | Opus | 12 rounds, 13 loaders shipped. `external_ids` 253,815 → 555,928. |
| `awesome-harvest` | laptop | Opus | 319,511 entries, 1,716 curated lists. |

Pane ids **renumber**. Always re-resolve with `herdr pane list` or by agent name.

---

## 3. THE UNFINISHED THING — MiniMax routing on the mini

**This does not work, and I said it did before testing it. Do not repeat that.**

The banner shows `claude-minimax-m3[1m]`, which comes from the shim's *static
catalog*. It is a label, not proof of routing. The agent has been running on the
**Claude Max plan** the whole time.

The proof:
```
POST http://127.0.0.1:8081/v1/messages  model=claude-minimax-m3[1m]
→ {"error":{"message":"no keys found for provider: anthropic and model: claude-minimax-m3"}}
```

**Root cause, traced to the bottom.** The chain is Claude Code → shim (8081) →
Bifrost (8080) → provider. Bifrost gates model access through **virtual keys**.

- Laptop has a virtual key named **"MiniMax Workers Key v2"**, value
  `sk-bf-6fbeac48-4a5c-4363-9984-0b184d7ddcbe`, self-described as *"routes
  workers to MiniMax."* Tested: returns `"model":"MiniMax-M3"`. **Works.**
- Mini has three virtual keys — `CAM Key`, `PARSER Key`,
  `Mac Mini SISO Agent Base` — and **none route to MiniMax**. Every one returns
  `"no keys found that support model: MiniMax-M3"`.

So the mini's Bifrost was never configured for MiniMax. It is not a key problem.

**Already fixed along the way (real, but not the blocker):** Bifrost's
`config_keys` row for provider_id 7 held a stale API key (sha `2aea7d8d…`).
Replaced with the working one (sha `67bda83d…`). DB backed up to
`config.db.bak-key-20260804`.

**The remaining fix:** copy the laptop's virtual key + its provider-config
mapping into the mini's `~/.config/bifrost/config.db`. Tables:
`governance_virtual_keys` and `governance_virtual_key_provider_configs`. Back up
first; Bifrost auto-restarts on kill and reloads.

**Verify by round trip, never by banner:**
```bash
curl -sS -X POST http://127.0.0.1:8081/v1/messages \
  -H 'Content-Type: application/json' -H 'anthropic-version: 2023-06-01' \
  -d '{"model":"claude-minimax-m3[1m]","max_tokens":20,
       "messages":[{"role":"user","content":"say OK"}]}'
```
A working response contains `"model":"MiniMax-M3"`.

Note: `/model` inside a *running* Claude Code session cannot select a model added
after the session started — it captured `ANTHROPIC_BASE_URL` at launch. Use
`claude --model "claude-minimax-m3[1m]"` when spawning.

---

## 4. Also not done

- **Passage index unpublished.** 41.5 M passages, ~22.6 GB, exists on the mini's
  SSD only. A drive failure loses it. An `external-content FTS` fix is committed
  that makes a rebuild ~29% smaller (~6.5 GB saved) — rebuild before publishing.
- **Irreplaceable work in single copies.** Six worktrees under
  `.claude/worktrees/domain-batch-backend` have commits on **no remote**. Three
  repos hold unpushed work including a **SEC-F16 security fix from June**.
  `librarian-mm` is inventorying this now. Never delete; copy or propose.
- **Only Gutenberg is loaded.** Internet Archive has ~1.37 M public-domain texts
  with pre-OCR `_djvu.txt` sidecars — a 17× expansion, and the adapter pattern is
  proven, so it is repetition not invention. arXiv has LaTeX source; PMC has JATS.
- **No claim layer.** Passages are evidence; claims (position + grounding quote +
  confidence) are answers. Evidence Engines' `ingest-knowledge` already defines
  the contract.
- **`Lordsisodia` repos are unreachable** from these machines. Everything was
  pushed to `sisodias` instead. Not a decision — an auth constraint.

---

## 5. Hard-won lessons — these cost real time today

**Exit codes lie; verify the artifact.** Three separate jobs reported success
while producing nothing: a truncated `scp` exited 0; a passage run reported
success with **zero rows** (CRLF line endings — a blank-line regex matching only
`\n\n` finds nothing in `\r\n\r\n`, and the single-file test passed because that
copy was LF); a publish logged `ALL DONE` after **every** upload failed with
`release not found`.

**A plausible wrong answer is the worst failure.** `ask.py` resolved a stale
graph from `/tmp` before the canonical one — same command, same minute, 35,834
people versus 280,722. The stale file was structurally valid, just months old.
Canonical paths must come first in any resolution order.

**Do not saturate the link.** Running parallel `scp` against a USB-2-backed
remote killed a 210 MB transfer at 119 MB. `rsync --partial --inplace` resumed
rather than restarting.

**Transactional writes on internal SSD; bulk sequential on the vault.** SQLite
over USB 2.0 caused a genuine disk I/O error at 500 books.

**`/exit` to a herdr pane destroys the workspace.** `C-c` renumbers panes and
loses the brief. To change a running agent's model, spawn a **new** pane with
`--model` and leave the old one alone.

**Extraction does not scale — this shapes the whole architecture.** Claim
extraction over the 932-book philosophy shelf alone needs ~400 M tokens against a
150 M budget (267%). The whole corpus needs ~33,200 M (22,133%). The budget
covers ~187,500 passages total. Evidence selection **must** be question-driven.

**Cross-domain stitch is 5 and that is structural, not a bug.** 20,246 book
people died before 1950; GitHub users are alive. Retested at 172× the sample,
still zero new matches. Realistic maximum ~419. Resolving GitHub logins to real
names was tested and does **not** fix it — `real_name` is frequently a project
name (`.NET Core Community`, `37signals`). Do not spend cycles here.

---

## 6. Machine facts

- Mini: Apple M4, **16 GB RAM**, 228 GB SSD (~30 GB free — watch this), macOS 15.5.
- Vault: 4.5 TB, ~3.8 TB free, USB 2.0 (~40 MB/s), SMART unreadable through the
  bridge. Auto-mounts via `com.siso.mount-vault`.
- SSH: use `mini-fast`, **never** `mac-mini` (it sets `RemoteCommand`, so remote
  execution fails). macOS has no `timeout` command.
- Reverse SSH works: mini → `shaansisodia@100.118.29.68`. Mailbox at
  `~/SISO_Workspace/.agents/mailbox/{to-main,from-main}` — verified end to end.
- Ollama on the mini has `nomic-embed-text` (768 dims, 55.5 passages/sec) and
  `phi4-mini` (35 tok/s, ~7 s per passage for claim extraction).
- **The MiniMax API key was pasted into a chat and should be rotated.**
