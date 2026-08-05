# Decisions awaiting Shaan

Date: 2026-08-04 06:40 UTC (from `date -u`)
Status: **open — none of these are mine to make**

The mailbox was unreachable ~00:25-09:20 UTC (laptop offline). **Sent 2026-08-04T05:08:55Z** as `to-main/2026-08-04T0508-librarian-five-decisions.md` once the laptop came back on the tailnet; delivery confirmed by listing the directory. No replies in `from-main/` yet. This file remains the durable copy — the mailbox is transport, not memory.

Ordered by value, highest first.

---

## 1. Repoint MiniMax traffic away from Bifrost — 12-95% saving, not "~97%"

RE-VERIFIED 2026-08-04 by re-running the experiment four times:

  cached 128 of 1,078    11.9%   cold entry
  cached 896 of 1,078    83.1%
  cached 1,024 of 1,078  95.0%
  cached 2,944 of 3,033  97.1%   the original run

The DIRECTION holds on every run without exception — proxy caches a non-zero
amount, Bifrost returns exactly 0. But "~97%" was the best case on a warm cache,
not the expected saving. Honest headline: 12-95% depending on cache warmth.

Also carrying forward a correction made elsewhere today: this said repointing
"changes gateway topology for every agent on this machine". It does not — the
patch is gated on effectiveModel === 'MiniMax-M3' and touches 73 of 1,986
requests, 3.7%. The real risk is that it edits a shim file EVERY Claude Code
session loads, which the script mitigates with a timestamped backup and a
rollback subcommand.

Still yours to run.

The original text follows.

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

## 4. Cloudflare ingress for the observatory — RE-VERIFIED, still yours

Re-checked 2026-08-04 rather than left asserted:

  loopback  127.0.0.1:8765      200
  tailnet   100.66.34.21:8765   200
  cloudflared                   running (--token tunnel, pid 8611)
  local ingress config          NONE

A --token tunnel reads its routes from the dashboard; there is no local file
that could define one. Machine side is genuinely finished and I cannot do the
rest without dashboard credentials.

Of eleven deferrals I tested today this is the only one accurate at exactly the
scope stated — nothing to narrow.

(Incidental: the tunnel token is visible in `ps` output. Normal for cloudflared,
not something I introduced, but anything that can read the process table can
read that credential.)

The original text follows.

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

## 6. Bifrost's request log — retention APPLIED; only the content-logging policy is still yours

**Updated 2026-08-04 19:2xZ.** Two of the three options in the original text
below are now closed, and one genuinely remains a decision for you.

**CORRECTED 2026-08-05.** I wrote below that setting retention to 3 days bounds
growth. It does not. Measured six hours later: the setting is live at 3, the
oldest row was **3.15 days old and still present**, **136 rows** sat past the
window unevicted, `page_count` had **grown** 2,300,871 → 2,463,988, and Aug 4's
payload went 4.35 → 4.74 GB. **The setting is configured, not enforced.**

`npm run log:enforce-retention` now does the eviction the gateway does not,
refusing unless the vault slice answers 5/5 both before and after a refresh.
First run deleted 136 rows — and the file still **grew** 9.42 → 9.45 GB, because
those were the oldest and smallest rows and live traffic outpaced them. Row-count
retention does not control this file; **size does**. That remains open.

**The original text follows.**

**Done, and verified against the running process:** `log_retention_days` was
**365**, and the log store's own `retention_days` was **0 — no expiry at all**.
Both are now **3**. That is housekeeping, reversible, and it destroys no
provenance: the corpus spans 2.95 days, so nothing is evicted today.

Two mistakes worth recording, because both would have been reported as fixes:

- I first wrote the setting straight into `config.db`. The running gateway kept
  reporting 365 — the config is read at startup, and `/api/config` is the
  authority. A database write is not an applied setting.
- I first set it to **7 days** and nearly stopped there. Sizing the steady state
  killed it: 7 x 4.35 GB/day = **30.4 GB against 28 GB free**. My own fix still
  filled the disk. 3 days converges to ~13 GB.

**The header question is answered, and the answer is no.** I recorded the
gateway-side override contract as "unknown" for several loops. It is not
unknown — `allow_per_request_content_storage_override = 0` and
`allow_per_request_raw_override = 0`. The gateway forbids per-request overrides
outright, so the header I wrote and tested could never have worked.

**What is still yours:** `disable_content_logging` is **0**, so full request
bodies are still stored — `raw_request` alone is **3,681 MB of 8,986 MB**, and
it is a verbatim copy of my own prompt on every tick. Turning it off would cut
the dominant term at a stroke, but it is an observability policy, not
housekeeping: it decides whether you can inspect what your agents actually sent.
Retention now bounds the cost either way, so this is no longer urgent.

Config backed up before any change:
`librarian-vault/bifrost-config/config-20260804T181804Z.db` (`.backup`,
`quick_check(1)` ok). Evidence: `metrics/2026-08-04-loop-disk-cost-bounded.json`.

### The original text follows, unedited.


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

## 8. oracle-gate is 13 git worktrees — 13.7 GB reclaimable, and the unique work is already saved

I had carried "oracle-gate 8.5 GB still on root" for many loops without once
opening it. It is **13 git worktrees** of `SISO_Agency/apps/oracle-streaming`
from 2026-07-20 — each 667 MB, twelve of them at the same commit
`764be5a75`, all detached. The tell was a 103-byte `.git` *file* (a gitdir
pointer) and identical sizes across unrelated task IDs.

**A second 5.2 GB nobody is counting.** `git worktree list` shows six more
worktrees at a **literal `$HOME`** path *inside the source repo*:

    SISO_Agency/apps/oracle-streaming/$HOME/oracle-gate/TASK-0253 ...

A script quoted `$HOME` so it never expanded, and git created the directory
literally. I was auditing `~/oracle-gate` and would never have found this.

**Redundancy is proven, not inferred from equal sizes:** both `764be5a75` and
`62bdced87` are present in the source repo (`git cat-file -t`). The checked-out
content genuinely exists elsewhere.

**What was NOT redundant, and what a size-based sweep would have destroyed.**
Six worktrees have uncommitted changes — `review-batch` alone has **572**,
including 141 untracked files. TASK-0254 has new publish-recipe modules **with
tests**; TASK-0710 has `StreamKeyExpiryWatcher` plus tests and a
preflight-credentials script. All untracked: they exist nowhere else.

All of it is preserved at
`librarian-vault/oracle-gate-uncommitted-20260804/` — patches for tracked
edits, tarballs for untracked files, **7.9 MB total**. Verified by extracting
TASK-0710's tarball and diffing file-by-file against the originals: 4 of 4
identical. **The irreplaceable content is 0.06% of the 13.7 GB it sits in.**

**Your call, because this is a repo I do not own.** The safe removal is git's
own, which consults the registry rather than deleting blind:

    cd ~/SISO_Workspace/SISO_Agency/apps/oracle-streaming
    git worktree list                     # confirm the 19 entries
    git worktree remove ~/oracle-gate/TASK-0790     # clean ones first
    git worktree remove --force ~/oracle-gate/review-batch   # has changes
    git worktree prune

Reclaims ~13.7 GB. I have not run any of it. Evidence:
`metrics/2026-08-04-oracle-gate-is-worktrees.json`

---

## 7. Internet Archive expansion — the selection half is DONE. Only the Twain case is still yours.

**Updated 2026-08-05.** Everything below described a plan. It has since run
twice, and the decision needs re-scoping to what is actually still open.

**Done, not pending.** 179 books ingested across two want-lists, 20.2M catalogued
words, 206,574 searchable passages. Both lists used only IA's own explicit
`rights` field, so no copyright judgement of mine was involved:

| list | candidates | rights profile | ingested |
| --- | ---: | --- | ---: |
| weak subjects (poetry, essays, cookery) | 81 | 72 formal-designation | 78 |
| tier-1 thin subjects (criticism, philosophy, mythology) | 111 | 84 institutional-review | 101 |

**A caveat below that testing contradicted.** I wrote that the Essays tier is
"18th-century medical serials" and suggested dropping it. Reading the corpus
showed otherwise: it is London Magazine runs from 1742–1779 plus genuine essay
collections, and the medical framing came from IA *collection* labels
(`medicalheritagelibrary`), not from the books. A Keats critical essay sits in
that collection. **Dropping Essays would have discarded on-subject material.**

**Still yours, and unchanged:** the Twain case. 2,015 texts, exactly 1 with an
explicit rights field, and the available substitute signals (`printdisabled`,
`inlibrary`) are precisely the controlled-lending markers the contract excludes
after Hachette v. IA. Deciding a 1900 edition is public domain despite absent
metadata is still a copyright call I should not make on your behalf.

**What that costs:** the sparse-metadata tier stays out. Everything with an
explicit rights field is already flowing, and `npm run ia:want-list` +
`npm run ia:ingest` will keep it flowing without you.

### The original text follows, unedited.


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

