<div align="center">

# Flyte

**An Electronic Flight Bag for student pilots and general-aviation pilots in Poland.**

Plan a route on a map, and the operational flight plan, the ICAO flight plan and the logbook entry
all derive from the same route – same weather, same aircraft, same numbers.

[![prose](https://github.com/czekanskyy/flyte/actions/workflows/prose.yml/badge.svg)](https://github.com/czekanskyy/flyte/actions/workflows/prose.yml)
[![status](https://img.shields.io/badge/status-phase%200%20%C2%B7%20foundation-orange)](docs/IMPLEMENTATION_PLAN.md)
[![PWA](https://img.shields.io/badge/PWA-installable-5a0fc8)](https://web.dev/progressive-web-apps/)

</div>

> [!IMPORTANT]
> **Flyte is not an approved source of aeronautical data.** It does not replace AIP, NOTAM or an
> official pre-flight briefing. Responsibility for the preparation and conduct of a flight rests
> with the pilot in command. The official source for Polish aeronautical information is
> [PANSA AIS](https://www.ais.pansa.pl/).

---

## The problem

Preparing a navigation flight in Poland today means working across four disconnected things at
once: a VFR chart, a manual E6B, an aerodrome data source, and a weather source. Every value is
copied by hand between them, and every copy is a chance to transpose a digit. The operational
flight plan is then filled in by hand, the ICAO flight plan is filled in again by hand, and the
flight is written into a paper logbook a third time.

Flyte collapses that into one tool, and verifies its arithmetic against hand-computed values.

## Features

| | |
|---|---|
| **Map and route planning** | Poland – airspaces, aerodromes, navaids, VFR reporting points, obstacles, terrain shading. Click anywhere to see what is nearby and build a route from it |
| **OFP generator** | Courses, times, safe altitudes, fuel plan, weight and balance with envelope, POH performance, weather, crew. Print-ready from four templates |
| **FPL generator** | ICAO Doc 4444 Items 7–19, validated field by field, with a live message preview and filing instructions |
| **Logbook** | AMC1 FCL.050 compliant – aeroplanes, sailplanes, FSTD. Table and paper-style views, automatic totals, recency tracking |
| **E6B simulator** | A graphical flight computer with rotating dials, plus form mode and a panel that shows the working |
| **Time marks** | Marks along a leg at fixed intervals, or snapped to ground features you can actually see from the cockpit |
| **Offline** | Calculators, logbook, OFP editing, the aeronautical database and last-fetched weather all work with no network |

Installable as a PWA on phone, tablet and desktop. Built to be equally usable planning at a desk
and re-checking a figure on an airfield apron.

## Project status

**Phase 0 – foundation.** The repository currently contains the product definition, the
architecture, the aviation reference and the agent operating manual. No application code yet.

| Phase | Scope | Status |
|---|---|---|
| 0 | Documentation, conventions, repository | ✅ complete |
| 1 | Monorepo, auth, database, i18n, theming, PWA, deployment | ⏳ next |
| 2+3 | Logbook ‖ calculation engine and E6B | planned |
| 4+5 | AIRAC import ‖ map, terrain, safe altitude | planned |
| 6 | OFP, weather, time marks, print templates | planned |
| 7 | FPL | planned |
| 8 | Settings, aircraft library, accessibility and performance | planned |

Detail in [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) ·
progress in [`docs/BACKLOG.md`](docs/BACKLOG.md).

## Design principles

**Calculations live in a package that cannot do I/O.** Every number a pilot might rely on is
computed in `packages/aviation`, which imports no React and makes no network calls. That constraint
is enforced by ESLint, and it is what keeps the hand-verified test suite fast enough to run on every
change rather than fast enough to be skipped.

**Golden vectors are never adjusted to make a test pass.** Every calculation is checked against
values computed by hand on a physical E6B, taken from a POH, or published by NOAA. If a vector and
the implementation disagree, one of them is wrong and a human decides which.

**No formula without a citation.** [`docs/DOMAIN.md`](docs/DOMAIN.md) is the only permitted source
of aviation formulas in the project. Anything not yet checked against a primary source is marked
`⚠ VERIFY` and blocks release rather than shipping quietly.

**Missing data is shown, not guessed.** A plausible-looking wrong number is more dangerous than a
visible gap. Stale weather is labelled with its age, unverified aircraft data is flagged everywhere
it appears, and an input the engine does not have produces an explicit "insufficient data" result –
never a default that looks like an answer.

**SI internally, branded types at the boundary.** Adding feet to metres is a compile error.

## Getting started

Requirements: Node ≥ 20.9 (25 recommended), pnpm 11, Docker for the PDF service.

```bash
git clone https://github.com/czekanskyy/flyte.git
cd flyte
pnpm install
cp .env.example .env.local
pnpm db:migrate
pnpm dev
```

Environment variables are documented in [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md) §11.

```bash
pnpm verify        # typecheck + lint + test + build + e2e - the pre-PR gate
pnpm test:vectors  # the hand-verified aviation calculations
pnpm test:e2e      # Playwright
```

> The commands above land in Phase 1. Today the repository carries documentation only, and the one
> check that runs is `node scripts/lint-prose.mjs`.

## Repository structure

```
apps/web/                 Next.js 16 application
packages/aviation/        Pure calculations - no React, no I/O, no network
packages/aviation-data/   Ports and adapters for external data sources
packages/db/              Drizzle schema and migrations
packages/ui/              Shared components
packages/config/          Shared ESLint, TypeScript and Tailwind configuration
docs/                     Product, architecture, aviation reference, process
scripts/                  Repository tooling
```

## Stack

Next.js 16 · React 19 · TypeScript 6 · Tailwind CSS 4 · MapLibre GL 6 · Drizzle ORM with Neon
Postgres and PostGIS · Better Auth · Serwist · Vitest · Playwright – in a pnpm and Turborepo
monorepo, deployed as Docker Compose behind a Cloudflare Tunnel.

Every version is pinned and justified in [ADR 0001](docs/adr/0001-stack-and-version-pins.md).
Notably, TypeScript is deliberately held one major behind `latest`;
[ADR 0002](docs/adr/0002-typescript-version.md) explains why, and states the condition for moving.

## Documentation

| Document | Purpose |
|---|---|
| [`AGENTS.md`](AGENTS.md) | **Start here if you are an AI agent.** The operating manual |
| [`docs/PRD.md`](docs/PRD.md) | What is being built, for whom, and what is out of scope |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | How it fits together, and what was deliberately not chosen |
| [`docs/DOMAIN.md`](docs/DOMAIN.md) | Every aviation formula, constant and rule, with citations |
| [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md) | External APIs, licences, rate limits, attribution policy |
| [`docs/SAFETY.md`](docs/SAFETY.md) | Safety requirements – functional, each with a test attached |
| [`docs/TESTING.md`](docs/TESTING.md) | Golden vectors, property tests, and the rest of the strategy |
| [`docs/PILOT_VALIDATION.md`](docs/PILOT_VALIDATION.md) | Manual checks a pilot performs at the end of each phase |
| [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) | Git, commits, pull requests, code style |
| [`docs/AGENT_WORKFLOW.md`](docs/AGENT_WORKFLOW.md) | How AI agents are organised on this project |
| [`docs/HANDOFF.md`](docs/HANDOFF.md) | How one agent hands work to the next |
| [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md) | Recurring obligations, including the 2030 WMM renewal |
| [`docs/adr/`](docs/adr/) | Architecture decision records |

## Built with AI agents

Flyte is developed largely by AI coding agents, one at a time, each picking up where the last ran
out of context. That makes the process documentation load-bearing rather than decorative:
[`AGENTS.md`](AGENTS.md) is the operating manual, [`docs/HANDOFF.md`](docs/HANDOFF.md) is the
protocol for stopping cleanly and picking up cold, and [`docs/DOMAIN.md`](docs/DOMAIN.md) exists so
that no agent ever has to recall an aviation formula from memory.

One consequence is worth naming: the incoming agent's first job is to review the pull request the
previous one left open. It is the only reviewer with genuinely fresh context, and reviewing the work
is also how it learns what it has inherited.

## Contributing

See [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md). In short: Conventional Commits, one task per
pull request, review by the next agent rather than your own, and `pnpm verify` green before
opening anything.

A defect in a calculation or a safety indicator is not an ordinary bug. It goes through the
[safety defect process](docs/SAFETY.md#10-reporting-a-safety-defect), which requires a reproducing
golden vector before any implementation change.

## Data sources and attribution

Aeronautical data from [OpenAIP](https://www.openaip.net/) (CC BY-NC-SA) ·
weather from the [NOAA Aviation Weather Center](https://aviationweather.gov/) and
[Open-Meteo](https://open-meteo.com/) ·
elevation from [Copernicus DEM](https://spacedata.copernicus.eu/) ·
ground features from [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors (ODbL) ·
magnetic declination from the
[NOAA NCEI World Magnetic Model 2025](https://www.ncei.noaa.gov/products/world-magnetic-model).

Full licence detail on the in-app `/credits` page and in
[`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md).

## Licence

Not yet determined. Flyte is a private, non-commercial project.

OpenAIP data is licensed **CC BY-NC-SA** and cannot be used commercially without a separate licence
from OpenAIP, so any change to the project's commercial status requires replacing that data source.
The `AeroDataSource` port exists partly to keep that option open.
