# Worklog: IA contract update from live findings

Date: 2026-08-03 22:53
Thread: Internet Archive source adapter
Proposal: `proposals/2026-08-03-ia-contract-live-findings.md`

## What changed

Updated `sources/internet-archive/adapter-contract.json` with the live metadata probe findings and extended the verifier so these rules stay enforced.

Added/changed:

- `legal_filter.rights_provenance`
- `selection.head_failure_route = "review"`
- `selection.metadata_sidecar_evidence_fields`
- `scale.live_public_domain_count_2026_08_03`
- `scale.live_probe_summary_2026_08_03`
- verifier checks for the new rights and HEAD semantics
- `metrics/2026-08-03-ia-contract-live-findings.json`
- this worklog

## Before / after numbers

| Measurement | Before | After |
| --- | ---: | ---: |
| rights provenance encoded | no | yes |
| HEAD failure review route encoded | no | yes |
| live probe summary in contract | no | yes |
| verifier enforces rights provenance | no | yes |
| verifier enforces HEAD failure route | no | yes |

## Evidence carried forward

From the live IA metadata probe:

- live public-domain count: 1,367,676
- explicit public-domain sample: 5/5 metadata OK, 5/5 public-domain signal, 5/5 DjVuTXT found, 4/5 sidecar HEAD OK
- famous identifier sample: 3/3 metadata OK, 2/3 DjVuTXT found, 0/3 item-level public-domain signal

## Contract decision

The loader must carry rights provenance from advancedsearch into the want-list. Item metadata rights alone are not enough to reconstruct why an identifier is safe.

HEAD failure is not final rejection when metadata provides DjVuTXT name, size, and md5. It routes to review or a controlled GET probe. This prevents rejecting valid public-domain records because IA blocks HEAD for a sidecar.

## Verification

`npm run verify` passes and now checks:

- `rights_provenance.required_for_ingest === true`
- missing/ambiguous rights route to `review`
- search-result rights are carried into the want-list
- HEAD failure routes to `review`
- sidecar metadata evidence includes `md5`

## What I got wrong / what surprised me

The first live probe looked worse than the source research because I used famous identifiers instead of identifiers selected through `rights:"public domain"`. The fix is not to loosen the rights filter; it is to preserve selection provenance.
