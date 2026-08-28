---
id: FLY-012
title: "packages/db: Drizzle, Neon, PostGIS, auth schema"
status: in-review
phase: 1
depends_on: [FLY-010, FLY-011]
owns_paths:
  - packages/db/**
  - package.json
  - pnpm-workspace.yaml
  - pnpm-lock.yaml
  - .env.example
  - docs/progress/FLY-012.md
  - docs/backlog/FLY-012-db-drizzle-neon.md
  - docs/BACKLOG.md
estimate: M
---

## Goal

`packages/db` talks to the Neon `dev` branch through Drizzle. The first migration enables
PostGIS and creates the Better Auth tables. `pnpm db:migrate` against `.env.local` is a
supported, documented command.

## Context

[ADR 0004](../adr/0004-neon-postgis.md): one Neon project, two branches, PostGIS in the first
migration. [ADR 0005](../adr/0005-better-auth.md): self-hosted Better Auth, Drizzle adapter,
auth tables in this same database.

The owner has already placed a `DATABASE_URL` for the **dev** branch in `.env.local`. Do not
print it, do not commit it, do not copy it into a progress file. If `DATABASE_URL` is missing,
stop and report – do not invent a local Postgres.

Better Auth's Drizzle schema is generated from the library, not designed by us. Use the
current `better-auth` (catalog pin) documented schema / CLI so the adapter matches. Typical
tables: `user`, `session`, `account`, `verification`, and `passkey` for the passkey plugin.
Do **not** invent extra columns on those tables in this task. Application columns (locale,
theme, first-run acknowledgement) wait for FLY-014 / FLY-019.

Schema files split per domain under `packages/db/src/schema/` even if only `auth.ts` exists
today. Migrations are named `NNNN_fly012_short_description.sql` and are forward-only.

`drizzle-orm` 0.45.2, `drizzle-kit` 0.31.10, `@neondatabase/serverless` 1.1.0 – catalog.

## Acceptance criteria

- [ ] `packages/db` has `drizzle.config.ts`, a client module that reads `DATABASE_URL`, and
      `src/schema/` exporting the auth tables.
- [ ] First migration: `CREATE EXTENSION IF NOT EXISTS postgis;` then the auth tables.
      File name matches `NNNN_fly012_*.sql`.
- [ ] `pnpm db:generate` and `pnpm db:migrate` at the repo root run the package scripts.
- [ ] `pnpm db:migrate` applies cleanly to the Neon `dev` branch.
- [ ] A tiny smoke test or script confirms PostGIS is actually there
      (`SELECT PostGIS_Version();`) without leaking the connection string.
- [ ] `.env.example` still documents `DATABASE_URL` as the **dev** branch, never `main`.
- [ ] No production connection string appears in any committed file.
- [ ] `pnpm verify` still green.
- [ ] `docs/progress/FLY-012.md` written. It records that migrate was run against `dev`, not
      the connection string.

## Test plan

- `pnpm db:migrate` on a database that already has the migration is a no-op (or drizzle's
  equivalent).
- Typecheck the schema. No `any`.
- If you add a unit test, it must not require the network when `DATABASE_URL` is unset – skip
  or use a documented env gate.

## Out of scope

- Better Auth configuration, API routes, or UI (FLY-014).
- First-run acknowledgement columns (FLY-019 may ALTER).
- Aeronautical / logbook / OFP tables.
- Redis.
- Enabling PostGIS by hand in the Neon console as a substitute for the migration.

## References

ADR 0004 · ADR 0005 · `docs/ARCHITECTURE.md` §8–9 · `docs/OWNER_SETUP.md` §1 ·
`docs/CONTRIBUTING.md` (migration naming) · `docs/HANDOFF.md` §8
