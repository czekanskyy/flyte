# IMPLEMENTATION_PLAN.md

The phase roadmap. What gets built, in what order, and what has to be true before each phase can
start.

Product requirements are in [`PRD.md`](PRD.md); technical structure in
[`ARCHITECTURE.md`](ARCHITECTURE.md); how one agent hands work to the next in
[`HANDOFF.md`](HANDOFF.md).

Estimates are in **agent sessions**. One agent works at a time, so these are sequential: the figures
add up rather than overlapping.

---

## Ordering rationale

Foundation first, then **logbook** rather than one of the more exciting modules. The logbook depends
on no external API, is immediately useful on its own, and exercises every pattern the rest of the
project needs: tables, print templates, offline sync, totals arithmetic, EASA compliance. Getting
those patterns right on a self-contained module is much cheaper than getting them wrong on the map.

The **calculation engine** follows, with the **E6B** built directly on top of it as its visible
proof: a graphical flight computer a pilot can check against a physical E6B. If the dial agrees with
the real thing, the OFP will too, and the failure gets caught by a human turning a dial rather than
by reading a column of numbers.

Aeronautical data before the map, because the map has nothing to draw without it. Terrain with the
map, because the elevation profile is a map feature. Then OFP, which consumes everything built so
far, and FPL, which consumes the OFP's route.

**Fast-track (owner, 2026-08-29).** Phase 2 logbook and remaining Phase 1 NAS/tunnel steps are
paused. FLY-020 (wind triangle + leg time) and FLY-021 (manual `/plan` table) come next so a
pilot can compute MH, WCA, GS and ETE from typed DIST, MT, TAS and wind, without map or weather
APIs. Fuel, print templates and immutable snapshots stay Phase 6. Do not start the logbook
until the owner says so.

---

## Blocking, before Phase 1

**FLY-002 – FAA NOTAM coverage spike.** No NOTAM code may be written until this reports, and a
refusal of access closes it. See
[`backlog/FLY-002-notam-coverage-spike.md`](backlog/FLY-002-notam-coverage-spike.md).

**Owner prerequisites**, none of which an agent can do:

| | Needed for |
|---|---|
| Neon project with `main` and `dev` branches | Phase 1 – the only hard blocker |
| Google OAuth client | Phase 1, Google sign-in only |
| Cloudflare Tunnel to `flyte.czekanski.dev` | Phase 1 deployment only |
| OpenAIP client id | Phase 4 |
| FAA API credentials | FLY-002, and likely to be refused |
| **Real POH data** (D-001) | Phase 3 weight and balance, Phase 6 OFP |
| OKL PRz OFP template (D-005) | Phase 6 print templates |

See [`OWNER_SETUP.md`](OWNER_SETUP.md) for how to obtain each.

---

## Phase 0 – Documentation and bootstrap · 6 sessions · complete

Repository, conventions, and every document an agent needs to work unsupervised: `PRD`,
`ARCHITECTURE`, `DOMAIN`, `DATA_SOURCES`, `SAFETY`, `MAINTENANCE`, `PILOT_VALIDATION`, `AGENTS`,
`AGENT_WORKFLOW`, `HANDOFF`, `CONTRIBUTING`, `TESTING`, ADRs 0001 and 0002, GitHub templates, and
the prose gate in CI.

**Done when:** an agent handed only a task file and this repository can execute it without asking
anything already written down.

## Phase 1 – Foundation · ~10 sessions

Monorepo with a pinned dependency catalog and Turborepo · `packages/config` carrying the ESLint flat
config, `eslint-plugin-boundaries`, tsconfig and Tailwind base · Neon with Drizzle, PostGIS and the
first migrations · **Better Auth** with all four sign-in methods and the `(auth)` pages · Next.js
App Router shell and `(app)` layout · `packages/ui` on shadcn/ui · theme system including the red
night mode · next-intl in Polish and English · PWA via Serwist, manifest and icons · Docker Compose
and the Cloudflare Tunnel · CI and CD · **`packages/aviation/units`** with branded types, converters
and its first golden vectors.

Task files (written at the Phase 0 → 1 sync point):

| Id | Title | Est. | Depends on |
|---|---|---|---|
| [FLY-010](backlog/FLY-010-monorepo-bootstrap.md) | Monorepo bootstrap | M | – |
| [FLY-011](backlog/FLY-011-shared-config-ci.md) | Shared config + CI verify | M | 010 |
| [FLY-012](backlog/FLY-012-db-drizzle-neon.md) | Drizzle + Neon + PostGIS | M | 010, 011 |
| [FLY-013](backlog/FLY-013-next-app-i18n.md) | App Router + next-intl | M | 011 |
| [FLY-014](backlog/FLY-014-better-auth.md) | Better Auth (four methods) | M | 012, 013 |
| [FLY-015](backlog/FLY-015-ui-theme-night.md) | UI kit + night mode | M | 013 |
| [FLY-016](backlog/FLY-016-pwa-serwist.md) | PWA | M | 013 |
| [FLY-017](backlog/FLY-017-docker-cd.md) | Docker Compose + CD | M | 013 |
| [FLY-018](backlog/FLY-018-aviation-units.md) | `aviation/units` | M | 011 |
| [FLY-019](backlog/FLY-019-first-run-ack.md) | First-run acknowledgement | S | 014, 015 |

**Done when:** the app is deployed at `flyte.czekanski.dev`, installable as a PWA, you can sign in
with a passkey and switch language, and `pnpm verify` is green in CI.

## Phase 2 – Logbook · ~8 sessions

Schema and CRUD · TanStack Table with sorting, filtering, pagination and column selection ·
**paper-style view** with *this page / brought forward / total* running totals · automatic totals by
class, type, function and period · FCL.060 recency · **sailplane fields** (launch method, launch
count, task, maximum altitude) · FSTD sessions · CSV import · print template rendered through
Playwright · **full offline** via Dexie with an outbox.

**Done when:** a month of real entries from the paper logbook produces identical totals, and the
printout would be accepted as a licence record.

## Phase 3 – Calculation engine and E6B · ~10 sessions

All of `packages/aviation` per [`DOMAIN.md`](DOMAIN.md): `geo`, `magnetic` (WMM2025 implemented
in-house), `atmosphere`, `navigation`, `mass-balance`, `performance`, `fuel`, `time` – each with
golden vectors sourced outside this codebase and property tests covering the documented invariants.

Then the **E6B**: two coaxial logarithmic dials in SVG driven by Pointer Events with momentum and
graduation snapping; the wind side with sliding card, grommet and wind dot; a form mode for every
operation; and a "show the working" panel exposing intermediate steps.

**Blocked in part by D-001.** Without real POH figures, mass and balance and performance ship on
placeholder data flagged `data_verified: false` and marked as unverified everywhere it appears.

**Done when:** the E6B agrees with a physical E6B across the Phase 3 pilot validation checklist.

## Phase 4 – Aeronautical data · ~8 sessions

`packages/aviation-data` with the port interfaces landed first, in their own task, so later work
builds against something committed · OpenAIP adapter · AIRAC importer and worker cron with row-count
sanity checks · PostGIS schema and GiST indexes · offline snapshot export to IndexedDB ·
`aip_overrides` for corrections from eAIP · the AIRAC expiry banner.

**Done when:** the Polish dataset imports on a cron, is queryable by position, and exports a
snapshot small enough for IndexedDB.

## Phase 5 – Map, terrain and safe altitude · ~12 sessions

MapLibre with OpenFreeMap and Terrarium hillshade · airspace, aerodrome, navaid and reporting-point
layers with filters and zoom-dependent labelling · **click to see nearby features** with
ADEP/ADES/waypoint actions · route editor with drag, insert into leg, reorder, undo and redo ·
search by ICAO, name, DMS and decimal coordinates · `packages/aviation/terrain` for corridor
sampling, MEF and safe altitude · `ElevationSource` adapter · **terrain profile chart** · mobile
performance work to hold 60 fps.

**Done when:** a route can be built by clicking, EPRJ renders correctly inside the EPRZ zone, and
safe altitudes for EPRJ to EPKR stand up against the VFR chart.

## Phase 6 – OFP, weather and time marks · ~18 sessions

The largest phase, and the one to split most carefully.

Weather adapters for AWC, Open-Meteo pressure levels, IMGW and a manual METAR/TAF paste parser ·
Redis caching with per-source TTLs · `<DataFreshness/>` · the shared `Route` object wired so the map
and the OFP edit the same state live · OFP form and computation · W&B envelope chart ·
`packages/aviation/timemarks` with the Overpass adapter · time marks on the map in **both** modes,
fixed interval and snap to feature · **four print templates**: GA, OKL PRz training, compact,
sailplane · immutable OFP snapshots.

**Done when:** an OFP for EPRJ to EPML and back matches manual computation throughout, and the
printout matches the OKL PRz template.

## Phase 7 – FPL · ~8 sessions

`packages/aviation/icao` for Items 7 to 19, encoding and validation, with golden vectors taken from
real messages · FPL form · pre-fill from route and aircraft profile · **live message preview with
in-place error highlighting** · copy to clipboard · printable form · IWB and telephone filing
instructions · reusable templates.

**Done when:** a generated message is accepted by IWB first time, with no field corrections.

## Phase 8 – Settings and polish · ~10 sessions

Settings backend and UI · GDPR export and account deletion · aircraft library with stations,
envelopes, POH tables and FPL equipment, plus JSON import and export · `fuel_policy` override ·
theme editor · **per-quantity unit configuration** · WCAG 2.1 AA audit · Lighthouse PWA at 95 or
better · testing on a real phone outdoors.

---

## Out of scope for v1

Offline map tiles (PMTiles) · self-hosted OSM import · self-hosted Copernicus GLO-30 · NOTAM
(conditional on FLY-002) · glider route planning · GPX/IGC import · route sharing · native app ·
IFR procedures.

Each has a revisit trigger recorded in [`MAINTENANCE.md`](MAINTENANCE.md).

---

## Phase sync point

At the end of every phase, before the next begins:

1. All task branches merged to `main`, CI green, no task left `in-progress`.
2. **Owner completes the pilot validation checklist** for that phase. An unexplained discrepancy in
   a safety-relevant figure blocks progress.
3. Dependency versions re-verified against the npm registry, not against recollection.
4. Architect writes the next phase's task files, each sized to one agent session.
5. `pnpm backlog:sync`.
6. Reset the `dev` Neon branch from `main`.
