# Review packet — every live claim, evidence resolved

Generated 2026-08-04T16:11:46.578Z by `scripts/build-review-packet.mjs`.

Each quote below was read from its source file at build time, not copied from the claim.
A quote marked **UNRESOLVED** means the byte range no longer matches — treat the claim as unsupported.

## How to disagree

Every claim states a position, a confidence, and an action. The useful review is not "is this well-formed" — a gate already checks that. It is:

1. Does the evidence support the position, or a weaker one?
2. Is the confidence justified, or is it a number attached to a hunch?
3. Is the proposed action the right response, and is it safe?

8 live claims, 2 superseded.

---

## GQ-001:enforcement-limits — confidence 0.72, action `proposed`

**Question.** How should the complete agent workspace be designed across code layout, agent architecture, memory, enforcement, and agent-generated user interfaces?

**Scope.** the enforcement and memory layers, measured over one continuous session

**Position.** Automated gates and execution catch different classes of defect and neither substitutes for the other. Gates detect drift between a recorded value and its source; they are blind to code that does not do what its description claims, to a wrong path shared by producer and checker, and to a diagnosis naming the wrong layer — every one of which occurred this session and was found only by running something. Two measured limits sharpen this. First, the gates have blocked ZERO pushes: verify runs before every push by habit and stops voluntarily, so it is a pre-commit convention rather than an enforcement boundary — nothing prevents a push that skips it. Second, a third category exists that the gates cannot occupy: when the gate self-test was first run it found the refresh evaluator swallowing every git error and reporting ten entries fresh from zero information. The workspace now runs 5 gates and 12 self-test cases. The original 3-versus-6 defect ratio is NOT refreshed here: classifying 134 worklogs by keyword produced 11-versus-13, and sampling showed the matches were mostly gate DEMONSTRATIONS on fixtures rather than real catches, so no honest mechanical successor to the hand count exists.

**Proposed action.** Stop adding gates at three. The marginal gate checks another recorded value; the marginal execution test checks whether something works. For a standing agent the higher-yield investment is a habit of running changed code against a copy, which caught the auth defect, the SIP block, and the misattributed cache diagnosis that no gate could see.

**Evidence, resolved from source:**

- `"defects_caught_by_a_gate": 3` — metrics/2026-08-04-gq001-workspace-enforcement.json [535:564], enforcement.defects_caught_by_a_gate
- `"defects_caught_only_by_execution": 6` — metrics/2026-08-04-gq001-workspace-enforcement.json [570:607], enforcement.defects_caught_only_by_execution
- `"automated_gates": 3` — metrics/2026-08-04-gq001-workspace-enforcement.json [325:345], enforcement.automated_gates
- `"pushes_blocked_by_verify": 0` — metrics/2026-08-04-gq001-rederived.json [1333:1362], what_is_countable.pushes_blocked_by_verify
- `"defects_the_selftest_found_on_first_run": 1` — metrics/2026-08-04-gq001-rederived.json [1283:1327], what_is_countable.defects_the_selftest_found_on_first_run

<sub>claims/GQ-001-enforcement-limits.claim.json · claim:GQ-001.enforcement-limits.v1</sub>

---

## GQ-002:caching-multiplier — confidence 0.79, action `proposed`

**Question.** What changes would make the complete provider-neutral SISO agent layer ten times more effective per unit of time, attention, and compute?

**Scope.** compute dimension — output returned per billed input token on this gateway

**Position.** Prompt caching is a large multiplier on compute effectiveness, but it is not the largest: the dominant variable is how much context a lane ships. Re-derived 2026-08-04 across 408, 1,553 and 181 requests, CodexOpenAI returns 85.86 output tokens per 1,000 billed input against Anthropic's 16.38 — a 5.2x spread (was 6.8x at lower volume). But MiniMax at 0% cache returns 25.31, BEATING Anthropic at 93% cache, which a pure cache-rate mechanism cannot explain. MiniMax ships 22,367 input tokens per request against Anthropic's 524,572. Caching is the second-order correction on a large context, not a substitute for having a small one.

**Proposed action.** Before evaluating model swaps for the 10x goal, fix caching where it is absent. The MiniMax path alone would move from 25.09 to a rate bounded by its 97% cache capability — a larger gain than any model substitution available on this gateway, and scripts/minimax-cache-route.sh already implements it reversibly.

**Evidence, resolved from source:**

- `"ratio": 6.8` — metrics/2026-08-04-gq002-effectiveness-per-compute.json [1536:1548], spread.ratio
- `"output_per_1k_billed_input": 25.09` — metrics/2026-08-04-gq002-effectiveness-per-compute.json [860:895], providers[].output_per_1k_billed_input (Minimax)
- `"spread_now": "5.2x (was 6.8x)` — metrics/2026-08-04-gq002-rederived.json [853:883], rederived.spread_now
- `"Minimax": 22367` — metrics/2026-08-04-gq002-rederived.json [1352:1368], what_actually_drives_it.avg_input_tokens_per_request.Minimax

<sub>claims/GQ-002-caching-multiplier.claim.json · claim:GQ-002.caching-multiplier.v1</sub>

---

## GQ-004:pi-primitive — confidence 0.62, action `proposed`

**Question.** For a named software primitive, which implementation is best for the stated context, and is it safe and valuable to reuse, vendor, or learn from?

**Scope.** the pi coding agent, as the binary behind this agent's own bulk lane

**Position.** The pi coding agent is safe to reuse for bounded stateless bulk work — MIT, same author, ~71 input tokens per call against ~41,000 through the full harness (figures from mini-pi's own comments, not measured here) — but its resolution is unsound: mini-pi documents @mariozechner/pi-coding-agent, that path does not exist, and it silently falls back to whatever pi is on PATH, which is @earendil-works/pi-coding-agent. The dependency is fine; the way it is named and located is not.

**Proposed action.** Pin the resolution rather than falling back to PATH: point PI_BIN at the installed @earendil-works path and update mini-pi's comments, which name a package that is not installed. A wrapper whose binary can change without it noticing is a supply-chain surface, even when the current binary is fine.

**Evidence, resolved from source:**

- `"actually_installed": "@earendil-works/pi-coding-agent"` — metrics/2026-08-04-gq004-pi-primitive.json [328:383], resolution_finding.actually_installed
- `"license_file_shipped": false` — metrics/2026-08-04-gq004-pi-primitive.json [791:820], rights_gate.license_file_shipped

<sub>claims/GQ-004-pi-primitive.claim.json · claim:GQ-004.pi-primitive.v1</sub>

---

## GQ-005:category-momentum — confidence 0.15, action `proposed`

**Question.** Which categories, techniques, and projects are gaining real momentum, what mechanisms explain the change, and what does the acceleration predict next?

**Scope.** maintenance momentum by curated category within the 463,221-edge GitHub corpus

**Position.** Agent infrastructure is where maintenance effort is concentrating: agent-memory-store (74.4%), agent-extension-pack (70.5%) and agent-ecosystem-artifact (69.9%) sit far above the 44.8% corpus baseline for repos pushed in 2025-2026, while ml-paper-impl sits below it at 34.9% — so attention appears to be moving from reproducing published research toward building durable agent tooling, rather than AI activity rising uniformly.

**Proposed action.** None yet. This is a directional reading of one corpus, not a basis for investment. It would become actionable if the same ordering held on a second signal — adoption or dependents rather than maintenance — which the graph can support but I have not measured.

**Evidence, resolved from source:**

- `"pct_recent": 44.8` — metrics/2026-08-04-gq005-category-momentum.json [287:305], corpus_baseline.pct_recent
- `"category": "agent-memory-store"` — metrics/2026-08-04-gq005-category-momentum.json [338:370], leaders[0].category

<sub>claims/GQ-005-category-momentum.claim.json · claim:GQ-005.category-momentum.v1</sub>

---

## GQ-006:push-verb — confidence 0.86, action `proposed`

**Question.** How should the information organ continuously gather, preserve, query, and push valuable evidence into authorized agent workflows and self-improvement loops?

**Scope.** which of the organ's four verbs have observed end-to-end receipts on this machine

**Position.** Three of the organ's four verbs are evidenced and the fourth is not. Re-tested live 2026-08-04: gather (90,209 curated owners in the people graph), preserve (22.59 GB vault copy of the passage index present) and query (that copy answers 77,540 book bodies) all have receipts. Push into an authorized workflow has never occurred — zero of SEVEN live claims carry an approval reference, up from zero of five when this was first written. The one claim marked done changed this repository under my own authority, which is precisely what does not count as an authorized push.

**Proposed action.** Treat the push verb as unbuilt rather than partially built. Adding an approval_ref field to the claim contract is cheap and would be theatre until a second party can actually grant one; the binding constraint is a reachable approver, not a schema.

**Evidence, resolved from source:**

- `"claims_with_approval_ref": 0` — metrics/2026-08-04-gq006-organ-receipts.json [819:848], organ_verbs.push.claims_with_approval_ref
- `"vault_copy_book_body": 77540` — metrics/2026-08-04-gq006-organ-receipts.json [679:708], organ_verbs.query.vault_copy_book_body
- `"claims_with_approval_ref": 0` — metrics/2026-08-04-gq006-rederived.json [734:763], verbs.push.claims_with_approval_ref
- `"live_claims": 7` — metrics/2026-08-04-gq006-rederived.json [771:787], verbs.push.live_claims

<sub>claims/GQ-006-organ-push-verb.claim.json · claim:GQ-006.push-verb.v1</sub>

---

## GQ-008:cache-block — confidence 0.88, action `proposed`

**Question.** Which available model should own each recurring work shape after quality, reliability, tool use, latency, quota, and cost are evaluated together?

**Scope.** cost dimension — where prompt caching is lost on the MiniMax path

**Position.** MiniMax's zero cache rate is a gateway defect, not a provider limitation. Re-run on demand 2026-08-04: an identical request with cache_control reads a non-zero number of prompt tokens from cache through the local proxy and EXACTLY ZERO through Bifrost, on every run. The proxy figure varies with cache entry age — observed 2,944 of 3,033 originally, then 1,024, 128 and 1,024 of 1,078 on later runs — so treat any single magnitude as a point observation. The zero does not vary. The cheap lane's cost disadvantage is therefore recoverable by fixing the routing path rather than by changing which model owns the work.

**Proposed action.** Route MiniMax traffic through the local proxy rather than Bifrost, or fix Bifrost's cache_control forwarding. Measured saving on a 3,033-token prompt is 2,944 cached tokens per repeated call. This changes gateway topology and is not a librarian decision.

**Evidence, resolved from source:**

- `"cached_tokens": 2944` — metrics/2026-08-04-gq008-cache-block-isolated.json [385:406], results[0].cached_tokens
- `"cache_works": false` — metrics/2026-08-04-gq008-cache-block-isolated.json [548:568], results[1].cache_works
- `"bifrost_arm": "0 cached on every run without exception` — metrics/2026-08-04-gq008-rerun-variance.json [1157:1212], bifrost_arm
- `"proxy_cached": 1024` — metrics/2026-08-04-gq008-rerun-variance.json [356:376], reruns[1].proxy_cached

<sub>claims/GQ-008-routing-cache-economics.v2.claim.json · claim:GQ-008.cache-economics.v2</sub>

---

## GQ-009:claim-layer — confidence 0.81, action `done`

**Question.** How should the Library expose answer-shaped claims without becoming the corpus warehouse or execution runtime?

**Scope.** registry-facing claim handoff contract

**Position.** The claim packet contract holds up under load: a question-driven registry can bind claims to evidence, freshness and action without warehousing corpus or running execution, and the layer's weak point is not its shape but whether freshness is derived rather than asserted.

**Proposed action.** Adopt claim-packet-v1 as the public handoff shape, with freshness derived mechanically by scripts/evaluate-refresh.mjs rather than asserted in the ledger.

**Evidence, resolved from source:**

- `"required_rights": "public domain"` — sources/internet-archive/adapter-contract.json [1086:1120], legal_filter.required_rights
- `"numFound_live": 1367676` — metrics/2026-08-03-ia-live-metadata-probe-combined.json [195:219], search.numFound_live
- `a hand-written assertion` — worklog/2026-08-04-0100-refresh-ledger-earns-its-claim.md [376:400], the-gap

<sub>claims/GQ-009-claim-layer-contract.v2.claim.json · claim:GQ-009.claim-layer.contract.v2</sub>

---

## GQ-010:fame-vs-dependence — confidence 0.84, action `proposed`

**Question.** Does popularity identify the software the world actually depends on, or does it systematically mismeasure it?

**Scope.** people graph — github domain, fame versus adoption

**Position.** Stars measure attention, not dependence, and the two diverge by orders of magnitude at the top: the most depended-upon packages in this graph carry thousands of times more dependent repositories than their star counts would predict, so any ranking built on popularity systematically misses the infrastructure it is standing on.

**Proposed action.** Do not rank people or work by stars alone in any Library-facing query. Where adoption data exists, prefer it; where it does not, say so rather than silently falling back to fame.

**Evidence, resolved from source:**

- `"dependent_repos": 4384968` — metrics/2026-08-04-gq010-underrated-evidence.json [336:362], top_underrated_by_dependents[0]
- `"edges_with_dependent_repos": 867` — metrics/2026-08-04-gq010-underrated-evidence.json [169:202], signal_coverage.edges_with_dependent_repos
- `"overlap_top50": 8` — metrics/2026-08-04-gq010-independent-rederivation.json [1541:1559], independent_test.overlap_top50
- `"top50_starred_with_zero_dependents": 20` — metrics/2026-08-04-gq010-independent-rederivation.json [1565:1605], independent_test.top50_starred_with_zero_dependents

<sub>claims/GQ-010-fame-vs-dependence.claim.json · claim:GQ-010.fame-vs-dependence.v1</sub>

---

## Superseded

- GQ-008:cache-economics — claim:GQ-008.cache-economics.v1 (superseded by a later claim; kept as history)
- GQ-009:claim-layer — claim:GQ-009.claim-layer.contract (superseded by a later claim; kept as history)
