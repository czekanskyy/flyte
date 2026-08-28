# ADR 0004 – Neon Postgres with PostGIS as the single datastore

**Status:** Accepted · **Date:** 2026-08-28 · **Supersedes:** – · **Superseded by:** –

## Context

Flyte needs a relational store for users, logbook, OFP snapshots and settings, and a spatial store
for aerodromes, airspaces, navaids and obstacles. Splitting those across two databases would mean
two backup stories, two migration tools and a join that cannot be a join.

The data is small. Poland's aeronautical dataset is a few megabytes. A full OpenStreetMap import
for time marks is a different scale and is out of scope for v1.

Neon provides Postgres with branching. Two branches cover the safety boundary the workflow needs:

| Branch | Purpose |
|---|---|
| `main` | Production. Never in a local `.env.local` |
| `dev` | The working branch. `DATABASE_URL` locally points here |

Agents run `pnpm db:migrate`. If the production string were in `.env.local`, a mistyped command
would migrate real data. See [`OWNER_SETUP.md`](../OWNER_SETUP.md) and
[`HANDOFF.md`](../HANDOFF.md) §8.

PostGIS is an extension, not a second product. Geometry columns with GiST indexes are ordinary
Postgres from the application's point of view.

## Decision

**One Neon project, Postgres + PostGIS, two branches (`main` and `dev`).** Drizzle is the schema
and migration tool. The first migration enables `postgis`. Schema files live under
`packages/db/src/schema/` split by domain.

Should a full OSM import ever be needed, it moves to a local PostGIS container on the TrueNAS
host and this ADR is superseded. That is not now.

Neon Managed Better Auth was evaluated and rejected; see [ADR 0005](0005-better-auth.md) and the
note in [`adr/README.md`](README.md). Neon is ordinary Postgres. Auth tables live in the same
database.

## Consequences

- One connection string, one migration tool, spatial queries as SQL.
- Production is unreachable from a development machine by construction.
- `dev` is disposable and is reset from `main` at each phase sync point.
- PostGIS must be enabled per branch (`CREATE EXTENSION IF NOT EXISTS postgis`); that is part of
  the first migration, not a manual owner step after the first time.
