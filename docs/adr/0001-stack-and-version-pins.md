# ADR 0001 – Stack and version pins

**Status:** Accepted · **Date:** 2026-08-28

## Context

Greenfield project. Every version below was read from the npm registry with `npm view` on
2026-08-28, not recalled from training data – several majors were further ahead than assumed
(MapLibre 6 not 5, ESLint 10 not 9, Vitest 4, TanStack Table 9). Re-verified at Phase 1 start
the same day; four patch/minor moves were applied (see Consequences).

## Decision

Versions are pinned exactly in `pnpm-workspace.yaml` under `catalog:`, and every package references
`"catalog:"` rather than a version string. One place to bump, and no way for one workspace package
to drift onto a different React.

### Core

| Package | Version | Note |
|---|---|---|
| `next` | 16.3.3 | App Router, Turbopack. `engines: node >=20.9` |
| `react`, `react-dom` | 19.2.8 | |
| `typescript` | **6.0.3** | Deliberately not 7.x – see [ADR 0002](0002-typescript-version.md) |
| `tailwindcss` | 4.3.3 | |
| `turbo` | 2.10.12 | |
| pnpm | 11.24.0 | See [ADR 0003](0003-package-manager.md) |

### Application

| Package | Version | Chosen because |
|---|---|---|
| `better-auth` | 1.7.2 | Only library with production support for all four required sign-in methods – email/password, Google, magic link, **passkeys**. Auth.js's WebAuthn provider is still experimental |
| `drizzle-orm` / `drizzle-kit` | 0.45.2 / 0.31.10 | SQL-shaped migrations, types generated from schema, PostGIS via `customType` |
| `@neondatabase/serverless` | 1.1.0 | |
| `maplibre-gl` | 6.6.0 | Native 3D terrain and hillshade from DEM tiles, no API key, genuinely open source |
| `react-map-gl` | 8.1.2 | Peer range `maplibre-gl >=1.13.0` – compatible with 6.x |
| `@tanstack/react-query` | 5.102.8 | With `query-sync-storage-persister` for offline |
| `@tanstack/react-table` | 9.2.4 | v9 is `latest` and stable |
| `zustand` | 5.0.15 | Holds the single `Route` object shared by map and OFP |
| `zod` | 4.5.1 | Same schemas across UI, API and calculation inputs |
| `react-hook-form` | 7.86.0 | |
| `next-intl` | 4.14.1 | |
| `serwist`, `@serwist/next` | 9.5.12 | Works with Turbopack; `next-pwa` still requires webpack |
| `dexie` | 4.4.5 | |
| `lucide-react` | 1.35.0 | |
| `d3-scale` | 4.0.2 | Scales only. Charts are hand-written SVG – W&B envelopes and terrain profiles must print correctly, which rules out canvas-based chart libraries |
| `date-fns` | 4.4.0 | |

### Aviation-specific

| Package | Version | Chosen because |
|---|---|---|
| `geographiclib-geodesic` | 2.2.0 | Exact WGS84 inverse and direct geodesic. turf.js assumes a sphere; that error accumulates across a multi-leg route and there is no reason to accept it |
| `suncalc` | 2.0.1 | Sunrise, sunset, civil twilight – the VFR-day limit |
| *(no WMM package)* | – | Every candidate on npm ships expired WMM2020 coefficients. WMM2025 is implemented in-house – see [ADR 0011](0011-wmm-implementation.md) |

### Tooling

| Package | Version |
|---|---|
| `vitest`, `@vitest/coverage-v8` | 4.1.11 |
| `@testing-library/react` | 16.3.3 |
| `playwright`, `@playwright/test` | 1.62.1 |
| `fast-check` | 4.9.0 |
| `msw` | 2.15.0 |
| `eslint` | 10.9.1 |
| `@eslint/js` | 10.0.1 |
| `typescript-eslint` | 8.68.0 |
| `eslint-plugin-boundaries` | 7.2.0 |
| `eslint-plugin-react-hooks` | 7.1.1 |
| `eslint-config-prettier` | 10.1.8 |
| `globals` | 17.11.0 |
| `prettier` | 3.9.6 |
| `size-limit` | 13.0.3 |
| `argon2` | 0.45.1 |

Deferred until needed: `pmtiles` 4.5.0, for offline map tiles – out of scope for v1.

`eslint-plugin-react@7.37.5` (latest on 2026-08-28) peers `eslint` up to `^9.7` and refuses ESLint 10.
It is **not** in the catalog. `eslint-plugin-react-hooks@7.1.1` does support ESLint 10 and is
enough until `eslint-config-next` arrives in FLY-013. Revisit `eslint-plugin-react` when its
peer range includes ESLint 10.

## Consequences

- One catalog to bump; no cross-package version drift.
- Two majors landed recently (MapLibre 6, TanStack Table 9). Phase 4 begins with a smoke test of
  MapLibre layer APIs against the v6 changelog rather than assuming v5 knowledge transfers.
- `typescript` and `typescript-eslint` are coupled; they move together, guarded by ADR 0002.
- Versions are re-verified against the registry at the start of each phase. Agents must not assume
  their training data reflects current releases – this ADR exists partly as evidence that assuming
  it would have been wrong four times over on day one.

### Phase 1 start re-verification (2026-08-28)

`npm view <package> version` against every pin above. Unchanged except:

| Package | Was | Now |
|---|---|---|
| `@tanstack/react-table` | 9.2.3 | 9.2.4 |
| `zod` | 4.4.3 | 4.5.1 |
| `next-intl` | 4.14.0 | 4.14.1 |
| `lucide-react` | 1.34.0 | 1.35.0 |

`typescript` latest is 7.0.2. `typescript-eslint@8.68.0` peer range is still
`typescript: >=4.8.4 <6.1.0`. [ADR 0002](0002-typescript-version.md) exit condition is **not**
met; catalog stays on `6.0.3`.
