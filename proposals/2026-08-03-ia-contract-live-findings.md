# Proposal: update IA adapter contract from live probe

Date: 2026-08-03
Thread: Internet Archive source adapter

## Gap

The IA live metadata probe found two loader-critical rules that are not encoded in the adapter contract:

1. Public-domain rights evidence may come from the advancedsearch result, not from item metadata alone.
2. A DjVuTXT sidecar `HEAD` can return 401/403 even when metadata lists size and md5, so HEAD failure should route to review rather than permanent rejection.

Leaving these out would make the future loader reject valid candidates or lose rights provenance.

## Evidence

Measured live probe results:

- live `rights:"public domain"` count: 1,367,676
- explicit public-domain sample: 5/5 metadata OK, 5/5 public-domain signal, 5/5 DjVuTXT found
- HEAD: 4/5 OK in explicit public-domain sample
- first famous-book sample: 3/3 metadata OK, 2/3 DjVuTXT found, 0/3 item-level public-domain signal

Measured contract before this change:

- `legal_filter.rights_provenance`: absent
- `selection.head_failure_route`: absent

## Proposal

Update `sources/internet-archive/adapter-contract.json` so future loaders must:

- carry rights evidence provenance from advancedsearch into the want-list
- accept item metadata rights as evidence only when present
- route missing rights evidence to review, not ingestion
- route sidecar HEAD failure to review when metadata provides name, size, and md5
- keep body download blocked until rights and sidecar evidence are sufficient

## Measurement expected to move

- rights provenance encoded: no -> yes
- HEAD failure review route encoded: no -> yes
- live probe finding references in contract: 0 -> 2+

## Non-goals

- Do not download IA text bodies.
- Do not write the Foundry loader yet.
- Do not weaken the public-domain filter.
