# Flyte

An Electronic Flight Bag for student pilots and general-aviation pilots in Poland.

Plan a route on a map, and the operational flight plan, the ICAO flight plan and the logbook entry
all derive from the same route — with the same weather, using calculations verified against
hand-computed values.

> **Flyte is not an approved source of aeronautical data.** It does not replace AIP, NOTAM or an
> official pre-flight briefing. Responsibility for the preparation and conduct of a flight rests
> with the pilot in command.

---

## What it does

| | |
|---|---|
| **Map & route planning** | Poland — airspaces, aerodromes, navaids, VFR reporting points, obstacles, terrain shading. Click anywhere to find what is nearby and build a route from it |
| **OFP generator** | Courses, times, safe altitudes, fuel, weight & balance, POH performance, weather. Print-ready from four templates |
| **FPL generator** | ICAO Doc 4444 Items 7–19, validated, with a live message preview and filing instructions |
| **Logbook** | AMC1 FCL.050 compliant — aeroplanes, sailplanes, FSTD. Table and paper-style views, automatic totals |
| **E6B** | A graphical flight computer with rotating dials, plus form mode and a "show the working" panel |
| **Time marks** | Marks along a leg at fixed intervals, or snapped to ground features you can actually see |
| **Offline** | Calculators, logbook, OFP editing, the aeronautical database and last-fetched weather all work with no network |

Installable as a PWA on phone, tablet and desktop.

## Status

**Phase 0** — documentation and repository bootstrap. Nothing is implemented yet.

Progress: [`docs/BACKLOG.md`](docs/BACKLOG.md) · Plan: [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md)

## Stack

Next.js 16 · React 19 · TypeScript 6 · Tailwind 4 · MapLibre GL 6 · Drizzle + Neon Postgres/PostGIS ·
Better Auth · Serwist · Playwright · Vitest — in a pnpm + Turborepo monorepo.

Full rationale and version pins: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and
[`docs/adr/`](docs/adr/).

## Getting started

Requires Node ≥ 20.9 (25 recommended), pnpm 11, and Docker for the PDF service.

```bash
pnpm install
cp .env.example .env.local
pnpm db:migrate
pnpm dev
```

Environment variables are documented in [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md) §11.

```bash
pnpm verify        # typecheck + lint + test + build + e2e — the pre-PR gate
pnpm test:vectors  # golden vectors: the hand-verified aviation calculations
pnpm test:e2e      # Playwright
```

## Repository layout

```
apps/web/                 Next.js application
packages/aviation/        Pure calculations — no React, no I/O, no network
packages/aviation-data/   Ports and adapters for external data sources
packages/db/              Drizzle schema and migrations
packages/ui/              Shared components
packages/config/          Shared ESLint, TypeScript and Tailwind configuration
docs/                     Everything below
```

## Documentation

| | |
|---|---|
| [`AGENTS.md`](AGENTS.md) | **Start here if you are an AI agent.** The operating manual |
| [`docs/PRD.md`](docs/PRD.md) | What is being built and for whom |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | How it fits together, and what was deliberately not chosen |
| [`docs/DOMAIN.md`](docs/DOMAIN.md) | **Every aviation formula, with citations.** The only permitted source |
| [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md) | External APIs, licences, attribution policy |
| [`docs/SAFETY.md`](docs/SAFETY.md) | Safety requirements — functional, with tests attached |
| [`docs/TESTING.md`](docs/TESTING.md) | Golden vectors and the rest of the strategy |
| [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) | Git, commits, pull requests, code style |
| [`docs/AGENT_WORKFLOW.md`](docs/AGENT_WORKFLOW.md) | How AI agents are organised |
| [`docs/LANES.md`](docs/LANES.md) | Path ownership for parallel agents |
| [`docs/DECISIONS_PENDING.md`](docs/DECISIONS_PENDING.md) | Open questions awaiting a human |

## Why some things are the way they are

**Calculations live in a package that cannot do I/O.** Every number a pilot might rely on is
computed in `packages/aviation`, which imports no React and makes no network calls. That is what
makes it possible to test the whole thing against hand-computed values in under a second — and
therefore what makes it possible to actually run those tests on every change.

**Golden vectors are never adjusted to make tests pass.** If a hand-computed value and the code
disagree, one of them is wrong and a human decides which.

**There is no automated flight plan filing.** PANSA IWB has no public API and registration requires
telephone confirmation. Flyte produces a correct, validated message and tells you exactly how to
file it.

**Sailplanes are logbook-only.** A glider goes where the weather is. Offering route planning would
imply a capability that does not exist.

## Data sources

Aeronautical data from [OpenAIP](https://www.openaip.net/) (CC BY-NC-SA) · weather from
[NOAA Aviation Weather Center](https://aviationweather.gov/) and [Open-Meteo](https://open-meteo.com/) ·
elevation from Copernicus DEM · ground features from [OpenStreetMap](https://www.openstreetmap.org/)
contributors (ODbL) · magnetic declination from NOAA NCEI WMM2025.

Full attribution and licence detail on the in-app `/credits` page and in
[`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md).

The official source for Polish aeronautical information is
[PANSA AIS](https://www.ais.pansa.pl/). Flyte is not a substitute for it.

## Licence

Not yet decided — a private, non-commercial project. Note that OpenAIP data is CC BY-NC-SA and
cannot be used commercially without a separate licence.
