---
id: FLY-002
title: "Spike: does the FAA NOTAM API actually cover EP** locations?"
status: todo
phase: 0
lane: any
depends_on: []
owns_paths:
  - docs/DATA_SOURCES.md
  - docs/adr/0012-notam-source.md
  - docs/progress/FLY-002.md
estimate: S
blocking: true
---

## Goal

Establish, with evidence, whether the FAA NOTAM API returns usable NOTAM data for Polish aerodromes —
so we know whether a NOTAM feature is possible at all before any code is written for one.

## Why this blocks everything else

There is **no free, legal, programmatic NOTAM source for European airspace**. EUROCONTROL EAD
requires a contract. The FAA API is the only candidate, and it is a candidate only because the FAA
redistributes international NOTAMs — whether that redistribution is complete and current for Poland
is unknown.

The failure mode we are guarding against is specific and serious: a NOTAM panel that returns an
empty list for EPRJ does not look broken. It looks like *there are no NOTAMs*. A pilot could
reasonably read it that way, and fly.

Better to have no NOTAM feature than one that lies by omission.

## Context

- API: `https://external-api.faa.gov/notamapi/v1/notams`
- Auth: `client_id` + `client_secret`, free self-service registration on the FAA API developer portal
- Relevant query parameters: `icaoLocation`, `notamType`, `responseFormat`
- Current documentation state is captured in `docs/DATA_SOURCES.md` §8

**The owner must register for FAA API credentials before this task can run.** Record them as
`FAA_CLIENT_ID` / `FAA_CLIENT_SECRET`. This is a prerequisite, not part of the task.

## Acceptance criteria

- [ ] A query for each of `EPRJ`, `EPML`, `EPKR`, `EPWA`, `EPRZ` has been executed and the raw
      responses saved to `docs/research/fly-002-faa-notam/`.
- [ ] For each location, recorded: number of NOTAMs returned, the issue time of the most recent one,
      and whether the response is well-formed.
- [ ] A same-day comparison against PANSA IWB (or the PANSA AIS NOTAM listing) for **at least
      EPWA and one of EPRJ/EPML/EPKR**, documenting: how many NOTAMs each source shows, and whether
      the FAA set is a subset, a superset, or divergent.
- [ ] Latency measured: how far behind PANSA is the FAA feed for a NOTAM issued today?
- [ ] `docs/DATA_SOURCES.md` §8 rewritten with the findings — the ⚠ UNVERIFIED marker either removed
      or replaced with the specific limitation found.
- [ ] `docs/adr/0012-notam-source.md` written, recording the decision and the evidence behind it.
- [ ] A recommendation stated plainly: **build**, **build with stated limitations**, or **fall back**.

## Decision rule

Write the recommendation against these thresholds, not against a general impression:

| Finding | Recommendation |
|---|---|
| Coverage matches PANSA, latency under ~1 h | **Build.** Ship with the "unofficial source, verify against PANSA AIS" label |
| Partial coverage, or latency of several hours | **Build with limitations.** Only if the gap can be stated precisely in the UI — "aerodrome NOTAMs only", "may lag PANSA by up to N hours". A vague warning is not sufficient |
| Sparse, stale, or empty for Polish aerodromes | **Fall back.** No NOTAM data display at all |

## Fallback design, if it comes to that

Not a lesser feature — a different, honest one:

1. A prominent link out to PANSA IWB and PANSA AIS for the planned route's aerodromes.
2. A "paste NOTAM text" field: the pilot pastes from IWB, Flyte parses the Q-line and validity
   period and attaches it to the OFP, clearly marked as manually entered.
3. An OFP checklist item — "NOTAMs checked" — with the timestamp of when the pilot confirmed it.

This is genuinely useful and makes no claim the data cannot support.

## Out of scope

- Any NOTAM parsing, storage, caching or UI code.
- Any adapter implementation. This task produces **documentation and a decision**, nothing else.
- Investigating paid EAD access — separate question, not now.

## References

- `docs/DATA_SOURCES.md` §8
- `docs/SAFETY.md` §2 — data freshness, and §4.3 — no silent fallbacks
- PANSA IWB: https://iwb.pansa.pl · PANSA AIS: https://www.ais.pansa.pl
