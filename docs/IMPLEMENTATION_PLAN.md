# IMPLEMENTATION_PLAN.md

The phase roadmap. What gets built, in what order, by which lane, and what has to be true before
each phase can start.

Product requirements are in [`PRD.md`](PRD.md); technical structure in
[`ARCHITECTURE.md`](ARCHITECTURE.md); parallel-agent mechanics in [`LANES.md`](LANES.md).

Estimates are in **agent sessions per lane**. Two lanes run concurrently, so a phase's wall-clock
cost is roughly its per-lane figure, not the sum.

---

## Ordering rationale

Foundation first, then **logbook** – deliberately, ahead of the more exciting modules. The logbook
depends on no external API, is immediately useful on its own, and exercises every pattern the rest
of the project needs: tables, print templates, offline sync, totals arithmetic, EASA compliance.
Getting those patterns right on a self-contained module is much cheaper than getting them wrong on
the map.

The **calculation engine** then lands alongside it in the other lane, with the **E6B** as its
visible proof: a graphical flight computer that a pilot can check against a physical E6B. If the
dial agrees with the real thing, the OFP will too – and the failure is caught by a human turning a
dial rather than by reading a spreadsheet of numbers.

Map, OFP and FPL follow, in the order of how much they depend on what came before.

---

## Blocking, before Phase 1

**FLY-002 – FAA NOTAM coverage spike.** No NOTAM code may be written until this reports. See
[`backlog/FLY-002-notam-coverage-spike.md`](backlog/FLY-002-notam-coverage-spike.md).

**Owner prerequisites**, none of which an agent can do:

| | Needed for |
|---|---|
| Neon project + `lane-a` / `lane-b` branches | Phase 1 |
| OpenAIP client id | Phase 4 |
| FAA API credentials | FLY-002 |
| Google OAuth client | Phase 1 |
| Cloudflare Tunnel to `flyte.czekanski.dev` | Phase 1 deployment |
| **Real POH data** (D-001) | Phase 2+3 weight & balance, Phase 6 OFP |
| OKL PRz OFP template (D-005) | Phase 6 print templates |

---

## Phase 0 – Documentation and bootstrap · 3 sessions

Repository, conventions, and every document an agent needs to work unsupervised.

| Lane | Delivers |
|---|---|
| A | `PRD.md`, `ARCHITECTURE.md`, `DOMAIN.md`, `DATA_SOURCES.md`, `SAFETY.md`, `MAINTENANCE.md`, `PILOT_VALIDATION.md`, ADRs 0001–0011 |
| B | `AGENTS.md`, `AGENT_WORKFLOW.md`, `LANES.md`, `CONTRIBUTING.md`, `TESTING.md`, `DESIGN_SYSTEM.md`, `.github/`, backlog scaffolding |

**Done when:** an agent handed only a task file and this repository can execute it without asking
anything that is already written down.

## Phase 1 – Foundation · 5 sessions per lane

| Lane | Delivers |
|---|---|
| A | Monorepo + `catalog:` + Turborepo · `packages/config` (ESLint flat config, `eslint-plugin-boundaries`, tsconfig, Tailwind base) · Neon + Drizzle + PostGIS + migrations · **Better Auth** with all four sign-in methods and the `(auth)` pages · Docker Compose · Cloudflare Tunnel · CI and CD |
| B | Next.js App Router shell and `(app)` layout · `packages/ui` with shadcn/ui · theme system (colours, transparency, radius, density, red night mode) · next-intl PL/EN · PWA: Serwist, manifest, icons, offline shell · **`packages/aviation/units`** – branded types, converters, presets, with golden vectors |

**Contract-first before the split:** `packages/db/src/schema/auth.ts` and the session helper
signature, so Lane B can build the shell against a known auth surface.

**Done when:** the app is deployed at `flyte.czekanski.dev`, installable as a PWA, you can sign in
with a passkey and switch language, and `pnpm verify` is green in CI.

## Phase 2+3 – Logbook ‖ Calculation engine · 8 sessions per lane

The cleanest parallel split in the project: pure mathematics on one side, data-driven UI on the
other, no shared files.

**Lane A – `packages/aviation` and E6B**

All modules per [`DOMAIN.md`](DOMAIN.md): `geo`, `magnetic` (WMM2025 implemented in-house),
`atmosphere`, `navigation`, `mass-balance`, `performance`, `fuel`, `time`, `logbook` rules – each
with golden vectors sourced outside this codebase, and property tests covering the invariants.

Then the **E6B**: two coaxial logarithmic dials in SVG driven by Pointer Events with momentum and
graduation snapping; the wind side with sliding card, grommet and wind dot; a form mode for every
operation; and a "show the working" panel exposing intermediate steps.

**Lane B – Logbook**

Schema and CRUD · TanStack Table with sorting, filtering, pagination and column selection ·
**paper-style view** with *this page / brought forward / total* running totals · automatic totals by
class, type, function and period · FCL.060 recency · **sailplane fields** (launch method, launch
count, task, maximum altitude) · CSV import · print template · **full offline** via Dexie with an
outbox.

**Done when:** the E6B agrees with a physical E6B across the Phase 2+3 pilot validation checklist,
and a month of real logbook entries produce totals matching the paper book.

## Phase 4+5 – Aeronautical data ‖ Map and terrain · 9 sessions per lane

**Contract-first before the split:** the `AeroDataSource` and `ElevationSource` port interfaces.

| Lane | Delivers |
|---|---|
| A | `packages/aviation-data` · OpenAIP adapter · AIRAC importer and worker cron · PostGIS schema with GiST indexes · offline snapshot export to IndexedDB · `aip_overrides` · `packages/aviation/terrain` – corridor sampling, MEF, safe altitude · `ElevationSource` adapter |
| B | MapLibre + OpenFreeMap + Terrarium hillshade · airspace, aerodrome, navaid and reporting-point layers with filters and zoom-dependent labelling · **click → nearby features panel** with ADEP/ADES/waypoint actions · route editor: drag, insert into leg, reorder, undo/redo · search by ICAO, name, DMS and decimal coordinates · **terrain profile chart** · mobile performance work to hold 60 fps |

**Done when:** a route can be built by clicking, EPRJ renders correctly inside the EPRZ zone, and
safe altitudes for EPRJ→EPKR stand up against the VFR chart.

## Phase 6 – OFP, weather, time marks · 9 sessions per lane

| Lane | Delivers |
|---|---|
| A | Weather adapters – AWC, Open-Meteo pressure levels, IMGW, manual METAR/TAF paste parser · Redis caching with per-source TTLs · `packages/aviation/timemarks` · Overpass adapter · integration of fuel, W&B and performance into a single OFP computation |
| B | The shared `Route` object wired so map and OFP edit the same state live · OFP form · W&B envelope chart · `<DataFreshness/>` · time marks on the map in **both** modes – fixed interval and snap-to-feature · **four print templates**: GA, OKL PRz training, compact, sailplane |

**Done when:** an OFP for EPRJ→EPML→EPRJ matches manual computation throughout, and the printout
matches the OKL PRz template.

## Phase 7 – FPL · 4 sessions per lane

| Lane | Delivers |
|---|---|
| A | `packages/aviation/icao` – Items 7–19 encoding and validation, route string builder and parser, golden vectors from real messages |
| B | FPL form · pre-fill from route and aircraft profile · **live message preview with in-place error highlighting** · copy to clipboard · printable form · IWB and telephone filing instructions · reusable templates |

**Done when:** a generated message is accepted by IWB first time, with no field corrections.

## Phase 8 – Settings and polish · 5 sessions per lane

| Lane | Delivers |
|---|---|
| A | Settings backend · GDPR export and account deletion · aircraft library API with JSON import/export · `fuel_policy` |
| B | Settings UI · theme editor · **per-quantity unit configuration** · aircraft editor (stations, envelopes, POH tables, FPL equipment) · WCAG 2.1 AA audit · Lighthouse PWA ≥ 95 · real-device testing outdoors |

---

## Out of scope for v1

Offline map tiles (PMTiles) · self-hosted OSM import · self-hosted Copernicus GLO-30 · NOTAM
(conditional on FLY-002) · glider route planning · GPX/IGC import · route sharing · native app ·
IFR procedures.

Each has a revisit trigger recorded in [`MAINTENANCE.md`](MAINTENANCE.md).

---

## Phase sync point

At the end of every phase, before the next begins:

1. Both lanes merged to `main`, CI green.
2. **Owner completes the pilot validation checklist** for that phase. Unexplained discrepancies in
   safety-relevant figures block progress.
3. Dependency versions re-verified against the registry.
4. Architect rewrites `LANES.md` and writes the next phase's task files.
5. `pnpm backlog:sync`.
6. Both lanes reset their Neon branches from `main`.
