---
id: FLY-021
title: "Manual /plan table: DIST, MT, TAS, wind → MH, WCA, GS, Time"
status: todo
phase: 6
depends_on: [FLY-019, FLY-020]
owns_paths:
  - apps/web/src/app/[locale]/(app)/plan/**
  - apps/web/src/lib/compute-manual-ofp.ts
  - apps/web/src/lib/compute-manual-ofp.test.ts
  - apps/web/next.config.ts
  - apps/web/package.json
  - apps/web/src/i18n/request.ts
  - apps/web/src/app/globals.css
  - messages/pl/plan.json
  - messages/en/plan.json
  - messages/pl/safety.json
  - messages/en/safety.json
  - pnpm-lock.yaml
  - docs/progress/FLY-021.md
  - docs/backlog/FLY-021-manual-ofp-plan.md
  - docs/BACKLOG.md
estimate: M
---

## Goal

A signed-in, acknowledged user can type DIST and MT per leg plus shared TAS, wind direction
and wind speed, and see MH, WCA, GS and Time. Same `packages/aviation` functions as FLY-020.

## Context

Fast-track slice of Phase 6. No map, no weather API, no Zustand `Route` (that waits for the
real OFP/map). Local React state is enough. Safety ack gate on `/plan` stays.

Course and wind are **one reference frame** (DOMAIN §6.5). The UI must say so. Mixing
magnetic track with true wind is the user's conversion, not ours.

Unit conversion only at this boundary: NM, kt, degrees in; SI into the engine; kt, degrees,
ceiled minutes out.

This is a **live calculator**, not an immutable OFP snapshot ([`SAFETY.md`](../SAFETY.md) §7).

## Acceptance criteria

- [ ] `/plan` still requires session + current safety acknowledgement.
- [ ] Shared TAS, wind direction, wind speed for every leg. Rows: DIST (NM), MT (deg).
      Add and remove legs. Touch targets ≥ 44 px. Usable at 375 px. Glass panel.
- [ ] Outputs per leg: WCA, MH, GS (kt), Time (minutes ceiled per §7). Route total from
      unrounded seconds, ceiled once.
- [ ] No-solution: explicit message, no invented numbers. Empty/invalid fields: incomplete,
      not `NaN`.
- [ ] Copy in `messages/{pl,en}/plan.json`, both languages. States same-frame wind/course
      and that this is not a stored OFP.
- [ ] `@flyte/aviation` is a web workspace dependency; `transpilePackages` includes it.
- [ ] Tests: `wind-triangle-001` numbers produce WCA/MH/GS within vector tolerance; two-leg
      90 s + 90 s total displays 3 min not 4.
- [ ] `pnpm verify` green.
- [ ] `docs/progress/FLY-021.md` written.

## Test plan

- `apps/web/src/lib/compute-manual-ofp.test.ts` – golden vector + rounding (node; the form
  is a thin client over this module). jsdom is not in the catalog; do not add it here.
- Manual: 375 px, add/remove rows, no-solution wind.

## Out of scope

- Print/PDF, ETO/ETD, fuel, frequencies, snapshots, map, weather fetch, VAR/WMM, Zustand.

## References

FLY-020 · `docs/DOMAIN.md` §6.5, §7 · `docs/SAFETY.md` §1.1, §7
