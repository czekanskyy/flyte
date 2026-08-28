---
id: FLY-010
title: "Monorepo bootstrap: pnpm workspace, catalog, Turborepo, package skeletons"
status: in-review
phase: 1
depends_on: []
owns_paths:
  - package.json
  - pnpm-workspace.yaml
  - pnpm-lock.yaml
  - turbo.json
  - .npmrc
  - .nvmrc
  - packages/aviation/package.json
  - packages/aviation/src/index.ts
  - packages/aviation-data/package.json
  - packages/aviation-data/src/index.ts
  - packages/db/package.json
  - packages/db/src/index.ts
  - packages/ui/package.json
  - packages/ui/src/index.ts
  - packages/config/package.json
  - apps/web/package.json
  - apps/web/src/placeholder.ts
  - scripts/backlog-sync.mjs
  - .env.example
  - README.md
  - docs/progress/FLY-010.md
  - docs/backlog/FLY-010-monorepo-bootstrap.md
  - docs/BACKLOG.md
  - .github/workflows/prose.yml
estimate: M
---

## Goal

`pnpm install` works on a cold clone, every workspace package exists as a skeleton, every
dependency version lives in the catalog, and `pnpm backlog:sync` regenerates `docs/BACKLOG.md`
from task frontmatter.

## Context

The repository is documentation only. There is no `package.json`. Phase 0 delivered conventions
and this task is the first application code.

Versions are pinned in [`docs/adr/0001-stack-and-version-pins.md`](../adr/0001-stack-and-version-pins.md)
(re-verified at Phase 1 start). Package manager decision: [ADR 0003](../adr/0003-package-manager.md).
TypeScript stays at **6.0.3**, not 7.x: [ADR 0002](../adr/0002-typescript-version.md).

Package names: `@flyte/aviation`, `@flyte/aviation-data`, `@flyte/db`, `@flyte/ui`,
`@flyte/config`. The Next.js app is `web` (directory `apps/web`).

Skeletons export an empty module so they are valid packages. Do **not** add ESLint, tsconfig
beyond a one-liner if needed, Drizzle, Next.js app code, or any feature. Those are later tasks.

`.env.example` currently mentions "Lane A" and "Lane B" (leftover from a two-agent layout that
was reversed). There is one agent. Remove that comment; keep the keys.

## Acceptance criteria

- [ ] Root `package.json` with `"packageManager": "pnpm@11.24.0"`, `"engines": { "node": ">=20.9.0" }`,
      and scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `test:vectors`, `verify`,
      `lint:prose`, `backlog:sync`, `db:generate`, `db:migrate` (the db ones may `echo` a
      "not yet" until FLY-012; they must exist).
- [ ] `pnpm-workspace.yaml` lists `apps/*` and `packages/*`, and a `catalog:` containing every
      package in ADR 0001 at the **re-verified** versions (including `@tanstack/react-table` 9.2.4,
      `zod` 4.5.1, `next-intl` 4.14.1, `lucide-react` 1.35.0, `typescript` **6.0.3**).
- [ ] `.npmrc` has `engine-strict=true`. Prefer `strict-peer-dependencies=true`.
- [ ] `.nvmrc` contains `24`.
- [ ] `turbo.json` pipelines for `dev`, `build`, `lint`, `typecheck`, `test` with sensible
      `dependsOn` (`^build` where needed). `dev` is persistent / uncached.
- [ ] Each of the five packages plus `apps/web` has a `package.json` with `"private": true` and
      a tiny `src/index.ts` (or `src/placeholder.ts` for the app) that exports `{}` or a
      package name string. No Next.js app generated yet.
- [ ] Workspace packages that will need them declare `typescript`, `vitest` etc. as
      `"catalog:"` – never a raw version string.
- [ ] `scripts/backlog-sync.mjs` reads `docs/backlog/*.md` YAML frontmatter and writes
      `docs/BACKLOG.md` in the existing format (generated banner, summary counts, blocking
      table, per-phase tables, legend). Running it is idempotent. It must not emit U+2014.
- [ ] `pnpm install` succeeds. `pnpm backlog:sync` succeeds and the diff against the committed
      `docs/BACKLOG.md` is empty after you have updated the Phase 1 table.
- [ ] `pnpm lint:prose` still passes.
- [ ] `.env.example` no longer mentions Lane A / Lane B.
- [ ] README "Getting started" no longer says the commands land in Phase 1 – `pnpm install`
      works. `pnpm verify` may still be incomplete; say so honestly.
- [ ] `docs/progress/FLY-010.md` written.

## Test plan

- Cold `pnpm install` (or `pnpm install --frozen-lockfile` after the lockfile exists).
- `node scripts/backlog-sync.mjs` then `git diff --exit-code docs/BACKLOG.md`.
- `node scripts/lint-prose.mjs`.
- `pnpm exec tsc --version` (once typescript is a root/catalog dep) prints `6.0.3`, not 7.x.

## Out of scope

- ESLint, Prettier, Vitest config, `eslint-plugin-boundaries` (FLY-011).
- Any Drizzle schema or Next.js `app/` tree.
- Docker, CI verify workflow (keep the existing `prose.yml`).
- Implementing units, auth, UI, i18n, PWA.
- Adding a dependency that is not in ADR 0001. If you truly need one, stop and write an ADR.

## References

ADR 0001 (catalog) · ADR 0002 (TypeScript 6.0.3) · ADR 0003 (pnpm) ·
`docs/ARCHITECTURE.md` §1 · `docs/IMPLEMENTATION_PLAN.md` Phase 1
