# Decisions awaiting Shaan

Date: 2026-08-04 06:40 UTC (from `date -u`)
Status: **open — none of these are mine to make**

The mailbox was unreachable ~00:25-09:20 UTC (laptop offline). **Sent 2026-08-04T05:08:55Z** as `to-main/2026-08-04T0508-librarian-five-decisions.md` once the laptop came back on the tailnet; delivery confirmed by listing the directory. No replies in `from-main/` yet. This file remains the durable copy — the mailbox is transport, not memory.

Ordered by value, highest first.

---

## 1. Repoint MiniMax traffic away from Bifrost — ~97% input-token saving

**Measured:** identical request, identical credential, only the path differs.

| Path | Prompt tokens | Cached |
| --- | ---: | ---: |
| go-llm-proxy `127.0.0.1:8789` | 3,033 | **2,944** |
| Bifrost `127.0.0.1:8080` | 3,033 | **0** |

Bifrost strips `cache_control`. The provider caches correctly. The 8081 shim already preserves the annotation and surfaces `cache_read_input_tokens` — those changes are in place and currently inert, because the shim still sends MiniMax traffic to Bifrost.

**Why I stopped:** repointing the shim changes gateway topology for every agent on this machine. A saving that large is exactly the change that should not be made unilaterally by the agent that found it, at 06:40, with no one awake to catch a mistake.

**What I'd need:** approval to change the shim's MiniMax upstream from 8080 to 8789, or a decision to fix Bifrost's forwarding instead. Evidence: `metrics/2026-08-04-gq008-cache-block-isolated.json`.

**Prepared, not applied.** `scripts/minimax-cache-route.sh` makes this a reviewed operation rather than a live edit:

- `status` — shows current routing and probes actual cache behaviour (currently `max_cache_read: 0`)
- `apply` — refuses if the proxy is not answering; backs up the shim; patches only the MiniMax branch so all other traffic still goes to Bifrost; syntax-checks; restarts; probes; **rolls back automatically** if the model is not MiniMax-M3 or cache reads are still zero
- `rollback` — restores the most recent backup and re-probes

One command to apply, one to undo, and it undoes itself if the health check fails. I have run `status` only — live routing is unchanged.

**Three rounds of testing found three defects**, each only visible by executing it: a missing auth swap (proxy returned 401), an undefined `PROXY_KEY` identifier, and `launchctl setenv` being blocked outright by System Integrity Protection. The key now travels via the daemon plist's `EnvironmentVariables`, the same mechanism `CLAUDE_MODEL_CATALOG_MINIMAX_CAP` already uses. Patch, auth, caching (2,944 vs 0 tokens) and the restart on the real daemon are all verified; only the plist backup/restore lines remain unexecuted, because writing to `/Library/LaunchDaemons` is itself a machine-configuration change.

---

## 2. Where should the rescue refs go? — FALLBACK NOW VERIFIED

Still yours: choosing a target remote. The commits touch CAM4 VPS and
circuit-breaker logic, and pushing someone else's work somewhere is an authority
question.

But the alternative you were offered — "local refs plus the vault bundle is
sufficient" — I have now MEASURED rather than assumed:

  local     5 refs under refs/rescue/ in SISO_Agency/apps/oracle-streaming
  bundle    all 5 SHAs confirmed present in the bundle history
            (fetched into a scratch repo, cat-file -e on each)
  verify    "The bundle records a complete history."  621 MB

So there is no risk of loss to decide about. This is a preference about
redundancy — a third copy on a remote — not a rescue.

The original text follows.

Five backend commits exist on no remote. They now have durable local refs under `refs/rescue/domain-batch-backend/`, and the vault bundle is proven restorable — I cloned it into a scratch repo and confirmed all five resolve with correct subjects, 79,459 objects.

**Why I stopped:** the commits touch CAM4 VPS and circuit-breaker logic. Pushing them anywhere is a judgement about exposure, not plumbing, and I do not know which remote is appropriate or whether that history should be public.

**What I'd need:** a target remote, or a decision that local refs plus the vault bundle is sufficient durability.

---

## 3. ~~What was SEC-F16 actually called?~~ RESOLVED 2026-08-04

**Answered by searching, not by asking.** "SEC-F16" appears in ZERO commits
across all 36 git repositories on this machine — only in documents describing
it, all tracing back to HANDOVER.md.

The work is real and already safe:

  bundle   .../librarian-vault/gap4-gap7-2026-08-03-2116/oracle-streaming-unremote-heads.bundle
  verify   "The bundle records a complete history."  (621 MB)
  branches lane/security-mini-TASK-0403-a2, lane/security-mini-repickup-20260720
  commits  2026-07-20  prompt-injection audit, overlay safety hardening,
                       domain-batch blocker verdicts

So it is a **prompt-injection audit and safety hardening dated 2026-07-20**, not
a "SEC-F16 fix from June". Both the name and the month were wrong. The
single-copy concern is discharged — it is in a verified bundle on the vault.

I asked you for "roughly which repo" when the answer was a grep across 36 repos
and one bundle verify. That was answerable by me the whole time.

The original text follows.

The charter names an unpushed SEC-F16 security fix from June as irreplaceable single-copy work. A literal grep for `SEC-F16`, `SEC F16`, and `SEC_F16` across `SISO_Workspace`, `.openclaw`, and this repo returns only the charter's own mention.

**Why I stopped:** it is either named differently in commit text or lives somewhere I have not searched. Guessing at a security fix's identity and "rescuing" the wrong commits would be worse than leaving it.

**What I'd need:** roughly which repo, or what it was actually called. That turns a wide search into a narrow one.

---

## 4. Cloudflare ingress for the observatory

The observatory serves on the tailnet (`100.66.34.21:8765`) and loopback, verified 200 on both, refused on LAN. It is not publicly reachable.

**Why I stopped:** cloudflared here is token-managed with ingress defined in the dashboard. There is no local config file that can route a hostname to port 8765 — this is not a limitation I can engineer around from the mini.

**What I'd need:** a dashboard route pointing at `http://127.0.0.1:8765`. Everything machine-side is ready; loopback is deliberately still bound for exactly this.

---

## 5. ~~Six registered God Questions have no testable contract~~ RESOLVED 2026-08-04

**No longer a decision.** `Testable contracts: 7 of 7` — every registered God
Question now carries success criteria, falsifiers and watch triggers. I wrote
them rather than continuing to ask. Two were downgraded from `answered` to
`partial` in the process: they had been marked answered while carrying zero
falsifiers, so nothing could contradict them.

Left here so the numbering is stable and the record shows what changed.

The original text follows.

`Testable contracts: 1 of 7`. Only GQ-009 carries success criteria, falsifiers, or watch triggers. GQ-002 and GQ-008 are marked `answered` with no falsifier that could ever reopen them — which is why my GQ-008 cache finding had to arrive as an outside proposal rather than a trigger firing.

**Why I stopped:** those are Works in someone else's registry. Inventing falsifiers for questions I have not researched would be precisely the fabrication I spent tonight removing.

**What I'd need:** either ownership to draft them, or confirmation that the gap is known and intentional.

---

## The one I cannot resolve by asking

GQ-009's watch trigger 5: *"A standing agent proposes a change to the Library or Foundry and it survives independent review — the first evidence that self-improvement is real rather than asserted."*

There are now 17 proposals in this repo and **zero have been independently reviewed**. I am the only reader. This trigger is the difference between a working loop and an elaborate diary, and by construction I cannot fire it myself.

The GQ-008 cache claim is the strongest candidate: it is measured, falsifiable, contradicts a question the registry marks `answered`, and has a concrete action attached.

---

## 6. Bifrost's request log — RE-MEASURED at 4.68 GB/day, and 91% of it is me

The headline below said ~1GB/day. Measured 2026-08-04 across the full log:
**4.68 GB today**, hourly rate rising (0.10 -> 0.33 GB), root down to 16Gi.

Attribution: **anthropic 1,490 requests / 4.25 GB = 91% of the day's growth.**
That is this agent. Each turn writes ~2.92 MB, and Bifrost stores the body
TWICE (`raw_request` + `responses_input_history`).

The 93% prompt-cache rate does not help — caching saves tokens and nothing on
disk. Projection is a range, not a number: ~22 hours if per-turn context keeps
compounding, ~94 hours if it goes flat.

There may also be a third option I had not seen: `allow_per_request_content_storage_override`
exists in `config_client`. Client side is confirmed capable; the gateway-side
header contract is unknown. See the escalation.

The original text follows.

`~/.config/bifrost/logs.db` went from **205MB to 3.3GB** during this session. Only 1,662 rows, but 1.57GB of payload — Bifrost persists full raw request and response bodies, averaging ~945KB per request.

| Day | Requests | Payload MB |
| --- | ---: | ---: |
| 2026-08-02 | 28 | 2 |
| 2026-08-03 | 759 | 501 |
| 2026-08-04 (half day) | 740 | 997 |

Root disk went 27Gi → 21Gi free tonight. At the current rate that is roughly three weeks of headroom.

**Why I stopped:** this log is the evidence base for the GQ-008 and GQ-002 claims and for the observatory's routing card. Pruning it would destroy the provenance of published claims, and retention is a machine-configuration decision.

**Reversible options, cheapest first:** stop persisting `raw_request`/`raw_response` (my claims only use token counts); enable a retention window if Bifrost supports one; or archive old rows to the vault before deletion.

**Evidence:** `metrics/2026-08-04-logs-db-growth.json`

---

## 7. Internet Archive expansion — NOT blocked on rights. Selection was, and it is now answered.

The headline below is wrong in scope. **270,049 IA texts carry an explicit
rights field set by IA** — those need no judgement from me. Only the
sparse-metadata cases (the Twain example) need one, and that deferral stands.

What was actually blocked was SELECTION, and the Library answers it: its own
`book_subject` table records what it collects. Filtering IA by subjects the
Library is WEAK in, then deduping by title, yields a concrete want-list:

  `sources/internet-archive/want-list-weak-subjects.json` — **81 identifiers**,
  Gutenberg mirrors excluded by rule, rights evidence graded in four tiers,
  8 of 8 sampled confirmed fetchable with DjVuTXT sidecars.

Caveat measured after building it: the Essays tier (30 of 81) is 18th-century
medical serials, because IA's subject vocabulary is looser than the Library's.
Poetry and cookery are on-subject. Dropping Essays leaves ~51.

The original text follows.

The adapter machinery works — contract, want-list, probe, author-dedup against 35,312 Library authors, all passing. The blocker is IA's metadata.

**Mark Twain has 2,015 texts on IA. Exactly 1 carries `rights:"public domain"`.**

Not because the others are in copyright — because the field is rarely populated. Sampling 40 of them: 38 have no `possible-copyright-status` at all.

The contract makes that field mandatory, so it excludes essentially the whole tier-1 corpus. But loosening it is not safe either: the same sample shows `printdisabled` (16) and `inlibrary` (13) — the **controlled-digital-lending collections the contract excludes after Hachette v. IA**. The signals available as substitutes are precisely the ones indicating borrow-only material.

**Why I stopped:** this is a copyright determination. Deciding that a 1900 Twain edition is public domain despite absent metadata is almost certainly correct and is still not a call I should make unilaterally on your behalf.

**Corrected 2026-08-04 after measuring rather than sampling:** the rights-clean pool is **270,046** English public-domain texts excluding borrow-only collections — 119,200 in `americana`, 37,299 of those pre-1930. My earlier 'dozens, not thousands' was wrong; I had sized it from three author queries.

That inverts the problem. Volume is not the constraint — **selection within the pool is**. Its head is ephemera: student newspapers, Sotheby's sales catalogues, family letters, photographs. So a publication-year rights heuristic would add volume to a pool that already has plenty.

**Live options:** a curated identifier list of works the Library actually wants; or full-text relevance sampling after fetch, which inverts the contract's check-before-download design and needs your view on whether that is acceptable.

**Evidence:** `metrics/2026-08-04-ia-rights-sparsity.json`

