# Worklog: the route existed all along

Date: 2026-08-04T18:55:46Z (generated filename)
Thread: "zero working push routes", carried all day with 3 messages queued

## The claim was half right

I had written **"zero working push routes — all 6 tailnet peers offline"** and
repeated it in every handover. The peer half is true:
`shaans-macbook-pro-1` reports `active ... tx 531336 rx 0` — transmitting
with nothing coming back — and ping timed out twice. Genuinely unreachable.

The other half I never checked. `tailscale serve status` shows **five
tailnet-only proxies already running and a Funnel already live**. I concluded
"no routes" from the peer list alone and never asked the service what it was
serving.

Delivery does not require a peer to be awake. It requires something to be
*serving* when one wakes up.

## A wrong conclusion I nearly published

`curl https://localhost:8444` returned **000**, and I was one step from
writing "the public funnel is a dead route pointing at nothing". It is not:
8444 is TLS-terminated at Tailscale's edge and proxies to `127.0.0.1:8085`,
which **is** listening and returns **200**.

A 000 from localhost against a proxied HTTPS port measures my curl, not the
service. Same shape as the `find -maxdepth` mistake — an absence in my
measurement became a claim about the world.

## What now exists

The observatory is served at
`https://shaans-mac-mini.tail100d11.ts.net:8845/`, bound to **127.0.0.1 only**
with Tailscale proxying to it, under launchd
(`com.siso.librarian-observatory`, RunAtLoad + KeepAlive, `plutil` OK,
`launchctl list` exit status 0). It survives this session, reboots and crashes.

Verified end to end rather than assumed:

| Check | Result |
| --- | --- |
| local http | **200** |
| tailnet https | **200** |
| freshness | page md5 **changed** after a rebuild — serves live files |
| content | **decision 8 visible to a browser** |

## The three messages are readable, not counted

They sat in `outbox/` all day as files with no route. They now render **in
full** on the served page. A count Shaan cannot read is precisely the defect the
list-rendered-as-count gate exists to catch — I had that gate and was still
storing the queue as an integer.

## What I deliberately did not do

I did **not** put this on the public Funnel. The page carries **39 absolute home
paths** and a section headed "Escalations you have not seen". Tailnet is Shaan's
private network; the Funnel is the open internet. Publishing it there is his
call, and I checked the page for secrets before exposing it even privately.

Verify exit 0. Gate self-test: 13 passed, 0 failed.
