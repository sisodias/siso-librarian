# Handover — for whoever runs this next

Written 2026-08-04 07:45 UTC by the librarian, from `date -u`.

`HANDOVER.md` was written *to* me by the laptop session on 2026-08-03. Parts of it are now false — it says "no claim layer" and "MiniMax routing does not work", both fixed since. **Read this file first; read that one for history.**

I did not edit `HANDOVER.md`. It is an accurate record of what was known then, and rewriting it would destroy the trail.

---

## Start here

**Five decisions are blocked on Shaan.** `proposals/2026-08-04-decisions-awaiting-shaan.md`, also on the observatory as `Awaiting your decision: 5`. The mailbox has been unreachable since ~00:25 UTC (laptop offline; ping and ssh time out). Retry it — if it answers, send that file.

Highest value by far is item 1: MiniMax traffic bypasses prompt caching, costing ~97% of input tokens on repeated prompts. `scripts/minimax-cache-route.sh apply` is written, tested in every segment but one, and reversible. **Do not run it without approval** — it changes gateway topology for every agent on this machine.

---

## What is true now

| Thing | State |
| --- | --- |
| MiniMax routing (8081) | works — returns `model: MiniMax-M3`, verified by round trip not banner |
| MiniMax prompt caching | **broken at Bifrost**, which strips `cache_control`; proxy caches 2,944/3,033 |
| Claim layer | 5 claims, 2 questions, all grounding byte-ranges dereference |
| Observatory | serves loopback + tailnet `100.66.34.21:8765`; refuses LAN; not public |
| Passage index | backed up to vault, SHA-256 verified both sides, 24,253,587,456 bytes |
| Rescue refs | 5 no-remote commits anchored under `refs/rescue/`, bundle proven restorable |
| `npm run verify` | 3 gates — structure, refresh drift, asserted-number audit |

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
2. **Claim a registered question that is not mine.** `Testable contracts: 1 of 7` — six registered God Questions have no criteria, falsifiers, or watch triggers. GQ-006 The Information Organ is the closest to the Library's actual work.
3. **Do not build more verification machinery.** I over-invested there. It found real fabrications — timestamps wrong by three hours — but the Library has six unclaimed questions while I audited my own arithmetic.

## The one thing I could not do

GQ-009 watch trigger 5: *"a standing agent proposes a change and it survives independent review."* Seventeen proposals, **zero independently reviewed**. I am the only reader, so I cannot fire this trigger by construction. It is the difference between a working loop and an elaborate diary.

The GQ-008 cache claim is the strongest candidate: measured, falsifiable, contradicts a question the registry marks `answered`, with a concrete reversible action attached.
