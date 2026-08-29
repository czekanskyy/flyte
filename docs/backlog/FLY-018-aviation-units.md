---
id: FLY-018
title: "packages/aviation/units: branded types, converters, golden vectors"
status: done
phase: 1
depends_on: [FLY-011]
owns_paths:
  - packages/aviation/**
  - pnpm-lock.yaml
  - docs/progress/FLY-018.md
  - docs/backlog/FLY-018-aviation-units.md
  - docs/BACKLOG.md
estimate: M
---

## Goal

`packages/aviation/units` exposes branded SI types and conversions for every row in
[`docs/DOMAIN.md`](../DOMAIN.md) §1.1. Golden vectors and round-trip property tests pass.
Mixing brands is a type error.

## Context

This is the first code in the safety-critical package. [ADR 0008](../adr/0008-si-branded-units.md)
and DOMAIN §1.1 are the spec. **Do not invent a factor.** If you need a unit that is not in
§1.1, stop, add it to DOMAIN.md with a citation, and then implement.

Architecture: `packages/aviation` imports nothing from this repository, no `react`, no I/O.
ESLint boundaries from FLY-011 must still pass.

Brand style (matches ARCHITECTURE.md):

```ts
type Metres = number & { readonly __brand: 'm' };
```

Constructors: `metres`, `feet`, `nauticalMiles`, `kilometres`, `statuteMiles`,
`metresPerSecond`, `knots`, `kilometresPerHour`, `feetPerMinute`, `milesPerHour`,
`kilograms`, `pounds`, `litres`, `usGallons`, `imperialGallons`, `kelvin`, `celsius`,
`fahrenheit`, `pascals`, `hectopascals`, `inchesOfMercury`, `seconds`, `minutes`, `hours`,
`radians`, `degrees`. Names may be grouped in modules (`length.ts`, `speed.ts`, …) but the
public API is documented from `packages/aviation` / `units`.

Knots: implement `1852 / 3600`, not the six-digit printout `0.514444`.

**No `massFromFuelVolume(litres)` without a density parameter.** Density comes from DOMAIN
§8.4 at the *call site* in a later phase. If you add a helper, its signature requires
`KilogramsPerLitre` (or `number` branded as density) and the helper lives next to fuel, not
as a default in units.

Errors are values: no `NaN`, no `Infinity`, no throw on finite input. A discriminated union
is only needed if you reject something; linear conversions of finite numbers always succeed.

Write tests **first**. Golden vectors before implementation.

## Acceptance criteria

- [ ] Every conversion in DOMAIN §1.1 exists in both directions (except the °C↔K / °F↔°C
      chain, which may go via kelvin).
- [ ] Golden vector file `packages/aviation/test/vectors/units.json`. Each vector has `id`,
      **`source`** naming Annex 5, NIST SP 811, BIPM, or an explicit derivation in DOMAIN
      §1.1, `given`, `expect`, `tolerance`.
- [ ] Minimum coverage: one vector per row of the §1.1 table, both directions, plus a
      round-trip identity case per quantity. Known exact values (e.g. 1 ft = 0.3048 m,
      1 NM = 1852 m, 1 lb = 0.45359237 kg, 0 °C = 273.15 K, 32 °F = 0 °C) must appear.
- [ ] fast-check: every conversion round-trips within relative `1e-9` on operational ranges;
      no public function returns `NaN` or `Infinity` for finite input.
- [ ] A type-level test (or a commented `// @ts-expect-error` fixture compiled in CI) proves
      `metres(...) + feet(...)` is illegal.
- [ ] `pnpm test:vectors` (or `pnpm test`) runs this package in well under one second.
- [ ] Doc comments on public functions link `docs/DOMAIN.md` §1.1.
- [ ] `pnpm verify` green.
- [ ] `docs/progress/FLY-018.md` written.

## Test plan

Named files:

- `packages/aviation/test/vectors/units.json` – golden vectors.
- `packages/aviation/src/units/*.test.ts` (or `units.test.ts`) – loader for the JSON plus
  property tests.

**Never adjust a golden vector to make a failing test pass.** If implementation and vector
disagree, leave it failing and say so.

Suggested first vectors (you still write the JSON; these are the ones a reviewer will look
for):

| id | source | given | expect |
|---|---|---|---|
| units-ft-m-001 | ICAO Annex 5 Ch.1 | 1 ft | 0.3048 m |
| units-nm-m-001 | ICAO Annex 5 Ch.1 | 1 NM | 1852 m |
| units-kt-ms-001 | derived DOMAIN §1.1 (1852/3600) | 1 kt | 0.514444… m/s |
| units-lb-kg-001 | NIST SP 811 / IYPA 1959 | 1 lb | 0.45359237 kg |
| units-c-k-001 | BIPM SI Brochure 9 | 0 °C | 273.15 K |
| units-f-c-001 | NIST SP 811 | 32 °F | 0 °C |
| units-inhg-pa-001 | NIST SP 811 conventional inHg | 1 inHg | 3386.389 Pa |
| units-usgal-l-001 | 231 in³, in = 0.0254 m | 1 US gal | 3.785411784 L |

## Out of scope

- Atmosphere, geodesy, wind triangle, fuel planning, WMM.
- UI unit-preference switcher (Phase 8).
- Fuel density defaults.
- Importing `react` or reading the filesystem from this package.

## References

`docs/DOMAIN.md` §1.1 · ADR 0008 · `docs/TESTING.md` §1–2 · `docs/ARCHITECTURE.md` §2, §10 ·
AGENTS.md rules 1–3
