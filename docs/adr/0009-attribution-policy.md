# ADR 0009 – Attribution policy

**Status:** Accepted · **Date:** 2026-08-29 · **Supersedes:** – · **Superseded by:** –

## Context

OpenAIP (CC BY-NC-SA) and OpenStreetMap (ODbL) require attribution. Flyte also produces OFP and
FPL printouts that must match a training organisation's paper template exactly. Extra logos,
licence lines or credit blocks make those printouts unusable.

The owner decided the policy with the licence terms in view. It is already written in
[`DATA_SOURCES.md`](../DATA_SOURCES.md) §10. This ADR exists so a later agent does not "fix"
it.

D-004 (default in effect): `/credits` lives inside the authenticated app, not on the public
site.

## Decision

1. **No attribution or licence text on printed output.** OFP and FPL printouts match the
   template. Visual regression must fail if attribution appears on a rendered page.
2. **In-app attribution only on views that actually consume OpenAIP (or OSM) data** – map,
   route editor, the route section of the OFP, FPL. Logbook, E6B, settings, account and auth
   show none.
3. **`/credits` carries the full legal detail** (every source, licence, AIRAC cycle once it
   exists, safety disclaimer) and a link to PANSA AIS. Phase 1 states that OpenAIP is not
   consumed yet and must not present that data as loaded.
4. **`/credits` is authenticated** until D-004 is flipped.

## Consequences

- Print templates stay empty of credits. That is the product, not an omission.
- Agents must not add a global footer credit "to be safe".
- When OpenAIP import lands, attribution is added only on the views in §10.2, in the same PR
  that first reads the data.
