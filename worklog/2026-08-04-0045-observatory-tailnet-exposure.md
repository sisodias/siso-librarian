# Worklog: observatory reachable from other devices, and why it is not public yet

Date: 2026-08-04 00:45
Thread: Observatory — "a URL I can view anywhere"

## What changed

The observatory was serving real data to nobody. It bound `127.0.0.1` only, so the page existed but no other device could open it — including the laptop and the phone. It now binds loopback *and* the mini's Tailscale address, in one process.

| Check | Before | After |
| --- | ---: | ---: |
| loopback `127.0.0.1:8765` | 200 | 200 |
| tailnet `100.66.34.21:8765` | unreachable | 200 |
| LAN `192.168.0.100:8765` | unreachable | refused (000) |
| bound sockets in process | 1 | 2 |

Live counts confirmed over the tailnet address, not just locally: 41,501,325 passages and 2,555,047 topic edges — the awesome-list promotion from the previous loop showing through end to end.

## The security decision, stated rather than assumed

This page is unauthenticated. The lazy move is `0.0.0.0`, which would have made it work everywhere in one character — and published a page describing internal corpus state to the local network.

So the server always binds loopback, and `SISO_OBSERVATORY_HOST` adds *one* extra address. Tailscale is an authenticated private mesh, so that address is safe in a way `0.0.0.0` is not. The code comment says so explicitly, because the next person to touch this will be tempted by the one-character version. LAN refusal is verified, not assumed.

## Why it is still not a public URL

I went looking for the tunnel config and found the answer is: there isn't one here.

- cloudflared is healthy — 4 ready connections, connector `92bbf9fc-56a0-4795-8298-13b1b2bf32dd`, version 2025.11.1.
- `cloudflared_config_local_config_pushes 0`, with `update_configuration` handled once *from the edge*.
- No `~/.cloudflared`, no `/etc/cloudflared`, no credentials file, no cert.

The tunnel runs purely from a token, and its ingress rules live in the Cloudflare dashboard. **There is no local file on this machine that can route a hostname to port 8765.** That is not a blocker I can engineer around from here; it is a change that has to happen in the dashboard.

The useful part is that everything on this side is now ready. Whenever a route is added pointing at `http://127.0.0.1:8765`, it will work immediately — loopback is deliberately still bound for exactly that reason.

## What I got wrong

I restarted the LaunchAgent with `kickstart -k` after editing the plist and it came back still on loopback. I nearly recorded that as "the env var doesn't apply." It did apply — launchd was holding the old job definition, and a full `bootout` + `bootstrap` picked it up. Worth remembering: `kickstart` restarts the process, it does not reload the plist.

Second miss, caught by checking rather than assuming: my first version *replaced* the loopback bind instead of adding to it. Tailnet worked, loopback broke. That would have silently killed local health checks and pre-broken the future tunnel route, since tunnel ingress targets `127.0.0.1`. The fix was binding both from a single process.

## Residual

Tailnet-only means "viewable anywhere I am on the tailnet" — laptop, phone — which is most of the practical value of the ask. It is not genuinely public, and I am not going to describe it as if it were. Closing that last gap needs a dashboard ingress rule, which is yours to make; everything on the machine side is done and verified.
