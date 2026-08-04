# Worklog: the regression that turned out to be my probe

Date: 2026-08-04T20:37:05Z (generated filename)
Thread: "written, tested, not applied" — testing the last three words

## The claim held

I have carried `minimax-cache-route.sh` all day as **"written, tested, not
applied"**. Today I learned it was also unreachable from any command, which made
me wonder whether "not applied" was another assumption I had never checked.

It was not. The script has a `status` mode, so I ran it instead of trusting my
own note: upstream is still `127.0.0.1:8080` (Bifrost), live probe reads
**0 cached tokens**. Not applied, confirmed by measurement.

## Then I nearly reported a regression against my own claim

I probed the proxy directly to re-verify the evidence under decision 1. It
returned **cache_read=0 on both attempts** — the same as Bifrost. If true, that
kills the decision: the whole case is that the proxy caches where Bifrost does
not.

Before writing that down, I ran the **original reproducer**:

```
{"path": "go-llm-proxy 8789", "prompt_tokens": 1078, "cached_tokens": 128, "cache_works": true}
{"path": "Bifrost 8080",      "prompt_tokens": 1078, "cached_tokens": 0,   "cache_works": false}
```

**It reproduces.** Sixth independent confirmation today.

My probe sent a **3,473-token** prompt where the experiment sends **1,078**, and
spaced its two calls further apart. Cold cache both times. The experiment warms
deliberately — that is why it issues two calls per path.

**I wrote a reproducer for exactly this experiment, then hand-rolled a different
probe to re-check it.** Use the reproducer.

## Two more scares that were my own shell

- `gate key readable: NO` — my inline heredoc mangled the regex quoting. The
  script's own extraction returns a 125-character key correctly, so the apply
  path would not have refused.
- `8789 -> 401` — the proxy requires an auth swap, which the script documents.
  **A 401 is the service answering.** A dead service does not authenticate you.

Three times in one turn I measured my own tooling and read it as a fact about
the world.

## Where the evidence stands

| | |
| --- | --- |
| direction | proxy non-zero, Bifrost **exactly zero** — every run today |
| magnitude | varies with cache age: 2944, 1024, 128, 1024, 128 |
| confirmations today | **6** |

The claim already says the direction is what it rests on, and the magnitude is a
point observation of a value that legitimately varies. That was written before
today's variance, and it held up.

Still not applied — a routing change to a live gateway Shaan owns, covered by
decision 1. What changed is that the evidence beneath it is re-verified rather
than assumed.

Verify exit 0.
