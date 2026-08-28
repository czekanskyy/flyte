---
id: FLY-011
title: "Shared config: TypeScript, ESLint boundaries, Prettier, Vitest, CI verify"
status: in-review
phase: 1
depends_on: [FLY-010]
owns_paths:
  - packages/config/**
  - eslint.config.js
  - prettier.config.js
  - vitest.workspace.ts
  - tsconfig.base.json
  - packages/aviation/tsconfig.json
  - packages/aviation-data/tsconfig.json
  - packages/db/tsconfig.json
  - packages/ui/tsconfig.json
  - apps/web/tsconfig.json
  - .github/workflows/ci.yml
  - .github/workflows/prose.yml
  - package.json
  - pnpm-workspace.yaml
  - pnpm-lock.yaml
  - docs/progress/FLY-011.md
  - docs/backlog/FLY-011-shared-config-ci.md
  - docs/BACKLOG.md
  - docs/adr/0001-stack-and-version-pins.md
estimate: M
---

## Goal

Every package typechecks against a shared strict tsconfig, ESLint enforces the
`packages/aviation` boundary, Prettier and Vitest are wired, and GitHub Actions runs
`pnpm verify` on every pull request.

## Context

FLY-010 left package skeletons and a catalog. Nothing yet fails a type error or a phantom
import. The boundary in [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) §2 is load-bearing: if
`packages/aviation` can import `react` or make a network call, the golden-vector suite stops
being cheap enough to run on every save.

`eslint-plugin-boundaries` needs type information from `typescript-eslint`, which is why
TypeScript is pinned to 6.0.3 (ADR 0002). Use ESLint 10 flat config.

CI today is only `.github/workflows/prose.yml`. Keep it. Add a `ci.yml` that runs the rest of
the gate. `pnpm verify` at the root should mean: typecheck, lint (including prose), test, build.
E2E is not in this task (no Playwright journeys yet); leave a `test:e2e` script that exits 0
with "no e2e yet" or is absent until a later phase.

## Acceptance criteria

- [ ] `packages/config` exports (or contains) the shared ESLint flat config, a base tsconfig
      (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` optional but
      `strict` + `noUncheckedIndexedAccess` are mandatory), Prettier options, and a Vitest
      shared config.
- [ ] Root `eslint.config.js` consumes the shared config. `eslint-plugin-boundaries` elements
      match the architecture diagram:
      - `aviation` may not import `ui`, `db`, `aviation-data`, `web`, `react`, `next`, or any
        HTTP / filesystem / database package.
      - `aviation-data` may import `aviation` only (of this repo).
      - `db` may not import `ui` or `web`. Prefer: `db` does not import `aviation` in Phase 1.
      - `ui` may import `aviation` and `aviation-data`, not `db` or `web`.
      - `web` may import all of the above.
- [ ] A fixture or a small test (can be an ESLint unit, or a checked-in file that *would* fail)
      documents the aviation boundary. The simplest approach: a comment in the config plus a CI
      lint that would catch `packages/aviation/src/index.ts` importing `react`. Do not add a
      real illegal import.
- [ ] Prettier is the formatter. A `pnpm format` / `lint --fix` path exists. No style arguments
      in review after this.
- [ ] Vitest workspace sees `packages/*` and `apps/web`. `pnpm test` runs and passes (zero
      tests is fine if Vitest exits 0).
- [ ] Each package has a `tsconfig.json` extending the shared base. `pnpm typecheck` passes.
- [ ] `.github/workflows/ci.yml`: on pull_request and push to `main`, setup pnpm 11 and Node 24,
      `pnpm install --frozen-lockfile`, then `pnpm verify`. Cache the pnpm store. Do not put
      secrets in logs.
- [ ] Existing `prose.yml` still runs. You may leave it separate (two required checks) or fold
      `lint:prose` into `pnpm verify` and keep `prose.yml` as a fast path – either is fine as
      long as em-dashes still fail CI.
- [ ] Any ESLint plugin not already in ADR 0001 (`eslint-plugin-react`,
      `eslint-plugin-react-hooks`, `globals`, `@eslint/js`, …) is added to the catalog with
      versions from `npm view` **the day you add them**, and a row is appended to the ADR 0001
      tooling table. Do not add a full new ADR for a stock ESLint plugin. Do not add
      `eslint-config-next` unless you are already in `apps/web` with Next.js (that is FLY-013);
      you can wait and let FLY-013 add it.
- [ ] `pnpm verify` is green locally.
- [ ] `docs/progress/FLY-011.md` written.

## Test plan

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm verify`
- Confirm `typescript` resolved version is 6.0.3 (`pnpm exec tsc --version`).

## Out of scope

- Next.js app, Drizzle, auth, UI components, i18n, PWA, Docker, units.
- Playwright e2e.
- Changing aviation formulas or DOMAIN.md.

## References

`docs/ARCHITECTURE.md` §2 · ADR 0001 · ADR 0002 · `docs/TESTING.md` (the gate) ·
`docs/CONTRIBUTING.md` (no `any`, no `@ts-ignore` without a FLY-XXX reason)
