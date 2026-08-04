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

## 2. Where should the rescue refs go?

Five backend commits exist on no remote. They now have durable local refs under `refs/rescue/domain-batch-backend/`, and the vault bundle is proven restorable — I cloned it into a scratch repo and confirmed all five resolve with correct subjects, 79,459 objects.

**Why I stopped:** the commits touch CAM4 VPS and circuit-breaker logic. Pushing them anywhere is a judgement about exposure, not plumbing, and I do not know which remote is appropriate or whether that history should be public.

**What I'd need:** a target remote, or a decision that local refs plus the vault bundle is sufficient durability.

---

## 3. What was SEC-F16 actually called?

The charter names an unpushed SEC-F16 security fix from June as irreplaceable single-copy work. A literal grep for `SEC-F16`, `SEC F16`, and `SEC_F16` across `SISO_Workspace`, `.openclaw`, and this repo returns only the charter's own mention.

**Why I stopped:** it is either named differently in commit text or lives somewhere I have not searched. Guessing at a security fix's identity and "rescuing" the wrong commits would be worse than leaving it.

**What I'd need:** roughly which repo, or what it was actually called. That turns a wide search into a narrow one.

---

## 4. Cloudflare ingress for the observatory

The observatory serves on the tailnet (`100.66.34.21:8765`) and loopback, verified 200 on both, refused on LAN. It is not publicly reachable.

**Why I stopped:** cloudflared here is token-managed with ingress defined in the dashboard. There is no local config file that can route a hostname to port 8765 — this is not a limitation I can engineer around from the mini.

**What I'd need:** a dashboard route pointing at `http://127.0.0.1:8765`. Everything machine-side is ready; loopback is deliberately still bound for exactly this.

---

## 5. Six registered God Questions have no testable contract

`Testable contracts: 1 of 7`. Only GQ-009 carries success criteria, falsifiers, or watch triggers. GQ-002 and GQ-008 are marked `answered` with no falsifier that could ever reopen them — which is why my GQ-008 cache finding had to arrive as an outside proposal rather than a trigger firing.

**Why I stopped:** those are Works in someone else's registry. Inventing falsifiers for questions I have not researched would be precisely the fabrication I spent tonight removing.

**What I'd need:** either ownership to draft them, or confirmation that the gap is known and intentional.

---

## The one I cannot resolve by asking

GQ-009's watch trigger 5: *"A standing agent proposes a change to the Library or Foundry and it survives independent review — the first evidence that self-improvement is real rather than asserted."*

There are now 17 proposals in this repo and **zero have been independently reviewed**. I am the only reader. This trigger is the difference between a working loop and an elaborate diary, and by construction I cannot fire it myself.

The GQ-008 cache claim is the strongest candidate: it is measured, falsifiable, contradicts a question the registry marks `answered`, and has a concrete action attached.

---

## 6. Bifrost's request log is growing ~1GB/day

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

## 7. Internet Archive expansion is blocked on a rights judgement, not on tooling

The adapter machinery works — contract, want-list, probe, author-dedup against 35,312 Library authors, all passing. The blocker is IA's metadata.

**Mark Twain has 2,015 texts on IA. Exactly 1 carries `rights:"public domain"`.**

Not because the others are in copyright — because the field is rarely populated. Sampling 40 of them: 38 have no `possible-copyright-status` at all.

The contract makes that field mandatory, so it excludes essentially the whole tier-1 corpus. But loosening it is not safe either: the same sample shows `printdisabled` (16) and `inlibrary` (13) — the **controlled-digital-lending collections the contract excludes after Hachette v. IA**. The signals available as substitutes are precisely the ones indicating borrow-only material.

**Why I stopped:** this is a copyright determination. Deciding that a 1900 Twain edition is public domain despite absent metadata is almost certainly correct and is still not a call I should make unilaterally on your behalf.

**Options, cheapest first:** accept a small high-confidence corpus (dozens, not thousands); use publication-year plus author death-date as a rights heuristic with a documented rule; or source tier-1 material from HathiTrust/Google Books where rights metadata is denser.

**Evidence:** `metrics/2026-08-04-ia-rights-sparsity.json`

