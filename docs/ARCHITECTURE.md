# ARCHITECTURE.md

How Flyte is put together, and why. Decisions with lasting consequences are recorded individually
in [`adr/`](adr/).

---

## 1. Shape

```
┌─────────────────────────────────────────────────────────────┐
│  apps/web — Next.js 16 (App Router)                         │
│                                                             │
│  Server Components ──▶ Route Handlers ──▶ external APIs     │
│         │                    │                              │
│         │                    └──▶ Redis cache               │
│         ▼                                                   │
│  Client Components ──▶ TanStack Query ──▶ Dexie (offline)   │
│         │                                                   │
│         └──▶ Zustand (route being edited)                   │
└───────────────┬───────────────────────┬─────────────────────┘
                │                       │
     ┌──────────▼──────────┐  ┌─────────▼──────────┐
     │ packages/ui         │  │ packages/db        │
     │ shadcn/ui, shared   │  │ Drizzle → Neon     │
     └─────────────────────┘  │ Postgres + PostGIS │
                              └────────────────────┘
     ┌───────────────────────────────────────┐
     │ packages/aviation-data                │
     │ ports (interfaces) + adapters         │
     │ OpenAIP · AWC · Open-Meteo · IMGW ·   │
     │ FAA NOTAM · Overpass                  │
     └──────────────────┬────────────────────┘
                        │
     ┌──────────────────▼────────────────────┐
     │ packages/aviation                     │
     │ PURE CALCULATION — no React, no I/O   │
     └───────────────────────────────────────┘
```

Dependencies point downward only. `packages/aviation` depends on nothing in this repository.

## 2. The one boundary that matters

`packages/aviation` may not import `react`, `next`, anything from `apps/*`, any HTTP client, or any
filesystem or database access. `eslint-plugin-boundaries` enforces it in CI.

The reason is testability. This package holds every calculation a pilot will rely on. Because it is
pure, its entire test suite — hundreds of hand-verified vectors plus property-based tests across
full input ranges — runs in under a second, on every save. The moment a network call or a React
hook enters, that stops being true, and the tests that actually protect people become slow enough
that people stop running them.

If a lint rule is fighting you here, the code belongs in a different package.

## 3. Ports and adapters for external data

Every external source sits behind an interface in `packages/aviation-data/src/ports/`:

```ts
export interface ElevationSource {
  sample(points: readonly LatLon[]): Promise<readonly Metres[]>;
}

export interface AeroDataSource {
  airportsNear(centre: LatLon, radius: Metres): Promise<Airport[]>;
  airspacesIntersecting(route: LineString): Promise<Airspace[]>;
  // …
}
```

This is not architecture for its own sake — three concrete substitutions are already anticipated:

- **Elevation:** Copernicus GLO-90 via Open-Meteo today; self-hosted GLO-30 when the Beskids demand
  better than 90 m resolution.
- **Aeronautical data:** OpenAIP today; the PANSA AIXM 5.1 dataset if the project ever licenses it.
- **NOTAM:** FAA today *if* FLY-002 confirms coverage; otherwise a manual-paste adapter.

Each substitution must be a one-adapter change with no edit to `packages/aviation` or to any UI.

## 4. Data flow

### 4.1 Aeronautical data — imported, not proxied

```
OpenAIP ──(worker, every AIRAC cycle)──▶ PostGIS ──▶ Route Handler ──▶ client
                                            │
                                            └──▶ snapshot ──▶ IndexedDB (offline)
```

Aeronautical data changes on a fixed 28-day cycle, and Poland's dataset is only a few megabytes.
Importing it buys fast PostGIS spatial queries, immunity to OpenAIP downtime, a trivial offline
snapshot, and a place to apply `aip_overrides` corrections from eAIP.

Every row carries its `airac_cycle`. Expiry raises the banner described in
[`SAFETY.md`](SAFETY.md) §3.

### 4.2 Weather — proxied with short cache

```
client ──▶ Route Handler ──▶ Redis ──(miss)──▶ AWC / Open-Meteo / IMGW
```

Weather changes by the minute, so it is fetched live. The server holds the API credentials, enforces
the cache TTLs and the `User-Agent` the providers require, and rate-limits us so we remain a good
citizen. The browser never talks to a weather provider directly.

### 4.3 The route is one object

The most common way an application like this goes wrong is the map and the flight plan drifting
apart — two representations of "the route", updated separately, disagreeing by one waypoint.

Flyte has exactly one `Route`, held in a Zustand store. The map is an editor for it. The OFP form is
another editor for it. Both read and write the same object; neither owns it. E2E test 2 asserts they
agree by checking that the sum of leg times equals the route total.

A generated OFP is a different thing entirely: an immutable snapshot, never a live view
([`SAFETY.md`](SAFETY.md) §7).

## 5. Offline

| Concern | Mechanism |
|---|---|
| Application shell | Serwist service worker, precached |
| Server state | TanStack Query persisted to IndexedDB |
| User data | Dexie — logbook, aircraft, routes, draft OFPs |
| Aeronautical data | Dexie snapshot of the Polish dataset, rebuilt each AIRAC cycle |
| Weather | Last fetched value with its observation time, **always rendered as stale** |
| Mutations while offline | Outbox: queued in Dexie, replayed on reconnect, conflicts resolved last-write-wins with the loser preserved |

Map tiles are deliberately **not** cached for offline use in v1. Doing it properly means hundreds of
megabytes of PMTiles and a download manager; doing it badly means a map that is silently missing the
area you need.

## 6. Rendering

Server Components by default. `'use client'` only where interaction requires it — the map, the E6B
dials, forms, the logbook table.

`packages/aviation` runs in both environments unchanged, being pure TypeScript. The same wind
triangle solver runs on the server for a PDF and in the browser for a live preview, which is exactly
why the OFP and the E6B cannot disagree.

## 7. PDF generation

```
React print template ──▶ HTML + print CSS ──▶ Playwright (flyte-pdf container) ──▶ PDF
                                        └──▶ browser Ctrl+P (same output)
```

One template source produces both the on-screen preview and the printed artefact, so they cannot
drift. Chromium's full CSS support — Grid, `@page`, custom fonts — is what makes reproducing a
training organisation's form to the millimetre feasible.

Chromium runs in its own container with a page pool, a memory cap and a healthcheck, so a PDF
failure cannot take the application down.

## 8. Authentication

Better Auth, chosen because it is the only library that supports all four required methods in
production: email and password, Google OAuth, magic link, and **passkeys**. Auth.js's WebAuthn
provider is still experimental.

Passkeys matter here beyond convenience: this application is used outdoors, in gloves, in sunlight,
where typing a password is genuinely awkward.

Sessions are database-backed via the Drizzle adapter. Passwords use Argon2id.

## 9. Database

Neon Postgres with PostGIS. Split by domain across `packages/db/src/schema/` — partly for clarity,
partly so two parallel agents rarely touch the same file.

Neon's branching is load-bearing for the parallel-agent workflow: each lane develops against its own
branch of the database, so one agent's migration cannot disturb the other. See
[`LANES.md`](LANES.md).

Geometry columns use PostGIS with GiST indexes. Everything else is ordinary relational data.

Should a full OpenStreetMap import ever be needed for time marks — gigabytes rather than megabytes —
it moves to a local PostGIS container on the TrueNAS host, and this document gets an ADR. Poland's
*aeronautical* dataset is small enough that splitting the database now would be premature.

## 10. Units

Everything inside the codebase is SI. Branded types make mixing units a compile error:

```ts
type Metres = number & { readonly __brand: 'm' };
type Feet   = number & { readonly __brand: 'ft' };
```

Conversion happens only at the UI boundary, through `packages/aviation/units`. Unit *preferences*
are a display concern and never touch a stored value — a stored OFP records the units it was
generated in so that reopening it years later is unambiguous.

This costs a little ceremony and removes an entire category of aviation software defect.

## 11. Deployment

```
GitHub Actions ──▶ GHCR ──▶ TrueNAS (Docker Compose) ──▶ Cloudflare Tunnel ──▶ flyte.czekanski.dev
```

| Container | Role |
|---|---|
| `flyte-web` | Next.js standalone |
| `flyte-pdf` | Playwright/Chromium |
| `flyte-redis` | Weather, NOTAM and Overpass cache |
| `flyte-worker` | AIRAC import cron, weather refresh, cache eviction |
| `cloudflared` | Tunnel |

Cloudflare Tunnel rather than port forwarding: no inbound ports open on a home network, works behind
CGNAT and a changing IP, TLS handled upstream. The database lives in Neon, so the application
survives rebuilding the NAS.

## 12. Deliberate non-choices

| Not used | Why |
|---|---|
| Leaflet | No native terrain; struggles with thousands of airspace polygons on a phone |
| turf.js for navigation | Spherical earth; error accumulates across a route. `geographiclib-geodesic` solves WGS84 exactly |
| `queryTerrainElevation()` for safe altitude | Only returns loaded viewport tiles — the answer would depend on where the user is looking |
| An existing WMM npm package | All ship expired WMM2020 coefficients. An expired magnetic model in an EFB is not acceptable |
| A separate API application | Next.js Route Handlers are sufficient; a second service would add deployment surface for nothing |
| TypeScript 7 | No stable programmatic API yet, so `typescript-eslint` cannot use it — and that is what enforces §2. See [ADR 0002](adr/0002-typescript-version.md) |
| bun | Faster installs, but the toolchain is Node-first and pnpm's strict `node_modules` catches phantom imports, which matters when agents write the code |
