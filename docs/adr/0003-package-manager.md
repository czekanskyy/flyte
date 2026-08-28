# ADR 0003 – Package manager: pnpm, not bun

**Status:** Accepted · **Date:** 2026-08-28 · **Supersedes:** – · **Superseded by:** –

## Context

The toolchain is Node-first: Next.js, Turborepo, Vitest, Playwright, `typescript-eslint`. bun
installs faster and runs TypeScript without a compile step, which is attractive for a monorepo
whose CI typechecks on every pull request.

Two properties matter more here than install speed.

1. **Phantom imports.** Agents write most of the code, across sessions that do not share memory.
   pnpm's strict `node_modules` layout refuses to resolve a package that is not declared in the
   consuming `package.json`. bun's default install is more hoisted; a stray `import` of a
   transitive dependency will work locally and fail in a cleaner environment, or worse, keep
   working.
2. **Catalog.** Flyte pins every version in one `pnpm-workspace.yaml` `catalog:` (ADR 0001). That
   is a pnpm feature. The alternative is a workspace protocol plus a lot of duplicated version
   strings, which is how one package drifts onto a different React.

## Decision

**pnpm 11**, with `packageManager` in the root `package.json` so Corepack pins the exact version,
`engine-strict=true` in `.npmrc`, and every workspace dependency referenced as `"catalog:"`.

bun is not used for install, run, or test.

## Consequences

- Slightly slower installs than bun. On this repository that is seconds, not minutes.
- Phantom imports fail at `pnpm install` / typecheck time rather than in production.
- One catalog to bump; no cross-package version drift.
- Agents must not add a `"bun.lockb"` or a `packageManager: bun@…` field. That would be a silent
  reversal of this decision.
