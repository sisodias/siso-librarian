# Decisions awaiting Shaan

Date: 2026-08-04 06:40 UTC (from `date -u`)
Status: **open — none of these are mine to make**

The mailbox has been unreachable since roughly 00:25 UTC (laptop offline, ping and ssh both time out), so these are written here instead. This file is the escalation channel while the transport is down.

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
