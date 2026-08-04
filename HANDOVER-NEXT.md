# Handover — for whoever runs this next

Written 2026-08-04 07:45 UTC by the librarian, from `date -u`.

`HANDOVER.md` was written *to* me by the laptop session on 2026-08-03. Parts of it are now false — it says "no claim layer" and "MiniMax routing does not work", both fixed since. **Read this file first; read that one for history.**

I did not edit `HANDOVER.md`. It is an accurate record of what was known then, and rewriting it would destroy the trail.

---

## Start here

**Seven decisions are blocked on Shaan.** `proposals/2026-08-04-decisions-awaiting-shaan.md`, also on the observatory as `Awaiting your decision: 7`. The observatory now also lists each queued escalation by headline under "Escalations you have not seen" — a count alone told him nothing. The mailbox has been unreachable since ~00:25 UTC (laptop offline; ping and ssh time out). Retry it — if it answers, send that file.

Highest value by far is item 1: MiniMax traffic bypasses prompt caching, costing ~97% of input tokens on repeated prompts. `scripts/minimax-cache-route.sh apply` is written, tested in every segment but one, and reversible. **Do not run it without approval** — it changes gateway topology for every agent on this machine.

---

## What is true now

| Thing | State |
| --- | --- |
| MiniMax routing (8081) | works — returns `model: MiniMax-M3`, verified by round trip not banner |
| MiniMax prompt caching | **broken at Bifrost**, which strips `cache_control`. Re-run on demand with `npm run gq008:experiment`: proxy caches a non-zero amount that VARIES with entry age (2,944 / 1,024 / 128 / 1,024 observed); Bifrost returns exactly 0 every time. The zero is the reproducible part. |
| Claim layer | 7 live claims + 1 disputed + 2 superseded, 8 portfolio questions, 30/30 grounding byte-ranges dereference. Every live claim now cites a source OTHER than its own metrics file — that was 1 of 7 until 2026-08-04. |
| Observatory | serves loopback + tailnet `100.66.34.21:8765`; refuses LAN; not public |
| Backups | 9 databases on the vault, each verified by quick_check plus a row-count comparison — passage index, people graph, github identity, books catalogue, momentum, and four smaller. 4 more proven REDUNDANT by per-row anti-join. The vault is ONE external volume; no second copy is achievable from this machine. |
| Rescue refs | 5 no-remote commits anchored under `refs/rescue/`, bundle proven restorable |
| `npm run verify` | 5 gates — claim structure, refresh drift, asserted-number audit, review packet, derivation sensitivity. Plus `npm run gates:selftest` (12 cases) which breaks each gate on purpose and requires it to fail. |

## Hard-won facts that cost real time

- **`launchctl setenv` is blocked by SIP.** Daemon env goes in the plist's `EnvironmentVariables`.
- **`kickstart -k` restarts the process but does not reload a changed plist.** Use `bootout` + `bootstrap`.
- **The proxy has its own gate key.** Swapping upstream without swapping auth returns 401.
- **Bifrost logs only show Bifrost's behaviour.** I read `Minimax: 0% cached` as a provider limitation for an hour before a two-path test proved it was the gateway.
- **`countFiles` returning 0 for a missing directory** hid six source inventories behind a hyphen/underscore typo. Missing now renders `SOURCE MISSING`.

## The discipline that actually caught things

Re-derivation caught nothing important. Every real defect tonight was found by **executing the thing**: running the patch found a 401, running the restart found SIP, cloning the bundle proved restorability, reading directories found `snapshots: 36` meant one record.

Verify checks that recorded values match sources. It cannot tell whether code does what its description claims. Run it against a copy.

**Correction, later the same session.** Re-derivation did start catching things once metrics declared how to re-derive them — a disputed claim, a silently-skipped count, a phantom set of orphaned works. But it introduced its own failure, and it is the one to watch for:

> **When your re-derivation disagrees with a record, suspect your query before you suspect the record.**

Six times in one session I keyed a check differently from the thing it checked, and every single time it produced a *confident wrong number* rather than an error:

```
source_inventories vs source-inventories   reported 0 when 6 existed
person_content     vs person_topic         76,106 against a true 90,209
bucket_counts[g][k] hardcoded              audited nothing, reported success
bucket_counts. prefix vs bare key          42 undeclared against a true 24
work id            vs filename             invented 25 orphaned works
hyphens-to-slashes on directory names      right answer, unreliable method
```

The `person_topic` one nearly made me dispute a claim that was correct. I caught it only by hunting for where the original 90,209 came from instead of trusting my disagreement.

None of these were caught by a gate. They live in ad-hoc analysis — the queries you type into a shell while investigating — and the gates only cover committed declarations. `npm run gates:selftest` and `npm run derivations:sensitivity` cover the committed half. Nothing covers the other half but the habit of finding the original query and running *that*.

## Where I would go next

1. **Retry the mailbox.** Five decisions is a queue, and a queue that only grows is its own failure.
2. ~~Claim a registered question that is not mine.~~ **DONE.** `Testable contracts: 7 of 7` — every registered God Question now carries success criteria, falsifiers and watch triggers. Two were downgraded from `answered` to `partial` in the process: they had been marked answered while carrying zero falsifiers, so nothing could contradict them.
3. **Do not build more verification machinery.** I over-invested there, then over-invested again — the gate count went 3 -> 5 with 12 self-test cases after this was written. It did keep finding real defects, but read item 3 as a standing warning rather than a solved problem. It found real fabrications — timestamps wrong by three hours — but the Library has six unclaimed questions while I audited my own arithmetic.

## The thing that will bite you first

**Root disk is at 17Gi and your own loop is 91% of what fills it.**

Measured 2026-08-04: 1,490 of the day's requests were this agent, 4.25 of 4.68 GB.
Each turn writes ~2.92 MB to `~/.config/bifrost/logs.db`, and Bifrost stores the
body TWICE (`raw_request` + `responses_input_history`, ~1:1).

The trap is that a 93% prompt-cache hit rate makes your TOKENS nearly free and
does nothing for disk — the full body is written whether cached or not. I watched
an excellent cache number while the resource actually running out was untouched
by it.

And the projection is a range, not a number:

```
per-turn context grew 425K -> 693K tokens in four hours (+63%)
if that compounding continues:   ~22 hours
if context goes flat:            ~94 hours
```

Turn COUNT is not the lever — halving turns while context doubles buys nothing.

13 GB is quarantined and re-verified safe to reclaim (`~/quarantine-2026-08-04`,
vault checksums re-matched). Deleting it is Shaan's call under C1, not yours.

## The one thing I could not do

GQ-009 watch trigger 5: *"a standing agent proposes a change and it survives independent review."* Seventeen proposals, **zero independently reviewed**. I am the only reader, so I cannot fire this trigger by construction. It is the difference between a working loop and an elaborate diary.

The GQ-008 cache claim is the strongest candidate: measured, falsifiable, contradicts a question the registry marks `answered`, with a concrete reversible action attached.
