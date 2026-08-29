---
id: FLY-020
title: "Wind triangle, angle wrap and leg ETE in packages/aviation"
status: in-review
phase: 3
depends_on: [FLY-018]
owns_paths:
  - packages/aviation/**
  - docs/DOMAIN.md
  - docs/IMPLEMENTATION_PLAN.md
  - docs/progress/FLY-020.md
  - docs/backlog/FLY-020-wind-triangle.md
  - docs/backlog/FLY-021-manual-ofp-plan.md
  - docs/BACKLOG.md
estimate: M
---

## Goal

`packages/aviation` solves the wind triangle (WCA, heading, GS) and leg ETE from SI inputs.
No-solution is explicit. Golden vectors in `test/vectors/navigation.json` pass. FLY-021 may
call this from `/plan`.

## Context

Owner fast-track: skip logbook and map/weather APIs so a typed OFP table can land. Formulas
are [`docs/DOMAIN.md`](../DOMAIN.md) §2.4, §6, §7. §6.5 records that course and wind must
share one reference frame; this task does **not** apply declination (§3.2).

Units stay SI inside the package. Degrees, knots and NM are a UI concern (FLY-021).

Architecture: no React, no I/O, no lat/lon, no `geographiclib`. ESLint boundaries from
FLY-011 still apply.

`signedDelta` range is **(−180°, 180°]** – exactly 180° is positive. JS `%` is not Euclidean
modulo.

## Acceptance criteria

- [x] `normaliseAngle` / `signedDelta` on branded radians, matching DOMAIN §2.4 range.
- [x] `solveWindTriangle({ course, tas, windFrom, windSpeed })` implements §6.2.
      Result `{ ok: true, wca, heading, gs }` or `{ ok: false, reason: "no-solution" }`.
      Never `NaN` or `Infinity`.
- [x] No-solution when `|WS/TAS · sin(Δ)| > 1` or `GS ≤ 0`, and when TAS ≤ 0 or WS < 0.
- [x] `legEteSeconds(distance, gs)` is `distance / gs` (§7). `displayMinutesCeil` rounds
      **up** to the next whole minute. `sumDurations` then ceil **once** for the route total.
- [x] Golden file `packages/aviation/test/vectors/navigation.json`. Every vector has `id`,
      **`source`**, `given`, `expect`, `tolerance`.
- [x] Required vectors: `wind-triangle-001` (DOMAIN §6.3, do not change expects); zero wind;
      pure headwind; pure tailwind; remaining three quadrants relative to TC 090; no-solution
      asin domain; no-solution GS ≤ 0; 100 NM at 100 kt → 3600 s; 61 s → 2 min display;
      90 s + 90 s → total display 3 min not 4.
- [x] fast-check: DOMAIN §6.4 invariants; no public function returns `NaN`/`Infinity` for
      finite input.
- [x] Doc comments cite DOMAIN.md sections.
- [x] `pnpm verify` green.
- [x] `docs/progress/FLY-020.md` written.

## Test plan

- `packages/aviation/test/vectors/navigation.json`
- `packages/aviation/src/geo/angles.test.ts`
- `packages/aviation/src/navigation/windTriangle.test.ts`
- `packages/aviation/src/navigation/legTime.test.ts`

## Out of scope

- Declination / WMM / VAR field.
- `/plan` UI (FLY-021).
- Fuel, ETO, geodesic distance, print.

## References

`docs/DOMAIN.md` §2.4, §6, §7 · `docs/TESTING.md` navigation coverage · ADR 0008
