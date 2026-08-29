# Phase 1 kickoff

## Session 1 · 2026-08-28 · architect

**State:** task files written on `docs/phase-1-foundation`. No application code yet.

**Done:**

- Re-verified every ADR 0001 pin with `npm view` (2026-08-28). Four patch/minor moves applied
  in ADR 0001: `@tanstack/react-table` 9.2.4, `zod` 4.5.1, `next-intl` 4.14.1,
  `lucide-react` 1.35.0. TypeScript latest is 7.0.2; `typescript-eslint` peer range is still
  `<6.1.0`, so ADR 0002 holds and the catalog stays on 6.0.3.
- ADRs 0003 (pnpm), 0004 (Neon/PostGIS), 0005 (Better Auth), 0008 (SI brands) written.
- DOMAIN.md §1.1: conversion factors from ICAO Annex 5 5th ed., NIST SP 811, BIPM SI Brochure 9.
  Knots are `1852/3600`, not the six-digit table printout.
- Task files FLY-010 … FLY-019. Order and dependencies are in `docs/BACKLOG.md`.
- Phase 1 checklist added to `PILOT_VALIDATION.md`.

**Owner prerequisites observed (do not repeat values anywhere):** Neon `DATABASE_URL`,
`BETTER_AUTH_SECRET`, Google OAuth client are present in local env. OpenAIP and FAA are not.
SMTP was not checked as a named key in the kickoff scan. Phase 1 can start; FLY-002 still
cannot.

**Not done:** FLY-010 implementation. That is the next concrete step.

**Decisions made, do not re-litigate:**

- Package names are `@flyte/aviation`, `@flyte/aviation-data`, `@flyte/db`, `@flyte/ui`,
  `@flyte/config`; the app package is `web`.
- FLY-018 may start as soon as FLY-011 lands; it does not wait for auth or the app shell.
- If FLY-014 grows past ~800 lines, split after email/password. The task file already says so.
- Fuel mass ↔ volume is not a units conversion. DOMAIN §1.1 and ADR 0008 both say this so
  FLY-018 does not grow a default density.

**Next concrete step:** `feat/FLY-010-monorepo-bootstrap` from this branch (or from `main`
once this PR is merged). Execute FLY-010 as written.

**Watch out:**

- `.env.example` still mentions Lane A / Lane B. FLY-010 deletes that comment. Do not
  resurrect a two-agent port split.
- Catalog `typescript` must be 6.0.3. `pnpm add typescript` without a pin will fetch 7.x and
  break `typescript-eslint`.
- `docs/BACKLOG.md` claims to be generated. The generator is part of FLY-010; until then the
  file is hand-matched to the format the script must reproduce.

---

## Session 2 · 2026-08-29 · implementer landing

**State:** Phase 1 **code** is one PR from complete. Branch `feat/FLY-017-docker-cd`,
pushed. Open PR https://github.com/czekanskyy/flyte/pull/15 (MERGEABLE). Working tree
should be clean except `next-env.d.ts` if `next build` ran.

**You are not the first agent.** Review #15 first (HANDOFF.md §4). Do not rubber-stamp
the Dockerfile: this session never ran `docker compose build` because the Docker engine
was down.

### What is on `origin/main` (squash-merged, treat as done)

| Id | Title | PR |
|---|---|---|
| FLY-010 | Monorepo bootstrap | #3 / #4 |
| FLY-011 | Shared config + CI | #5 |
| FLY-012 | Drizzle, Neon, PostGIS, auth tables | #8 / #9 |
| FLY-013 | App Router + next-intl PL/EN | #6 / #7 |
| FLY-014 | Better Auth (password, passkey, Google, magic link) | #10 |
| FLY-015 | Glass, light / dark / night | #11 |
| FLY-018 | `packages/aviation/units` branded SI + golden vectors | #12 |
| FLY-019 | First-run ack, `/plan` gate, `/credits` | #13 |
| FLY-016 | PWA (Serwist, manifest, icons, offline fallback) | #14 |

Owner has signed in locally with email/password. `/pl/credits` and `/pl/plan` returned
200 with a session (ack accepted). Passkey on Windows Hello was **not** exercised.

### Open

| Id | Title | Where |
|---|---|---|
| FLY-017 | Docker Compose + CD to GHCR | PR #15, `feat/FLY-017-docker-cd` |
| FLY-002 | FAA NOTAM coverage spike | `todo`. Needs owner FAA credentials. Does **not** gate Phase 1. |

### Phase 1 "done when" (IMPLEMENTATION_PLAN.md)

App at `flyte.czekanski.dev`, installable PWA, passkey sign-in, language switch,
`pnpm verify` green in CI.

Still owner-side after #15 merges: TrueNAS pull of GHCR, compose up, Cloudflare Tunnel
(`OWNER_SETUP.md` §3 and "After GHCR has a flyte-web image"). Then
`docs/PILOT_VALIDATION.md` Phase 1 checklist (owner, as a pilot, not an agent).

### Decisions made, do not re-litigate

- **Units:** branded numbers. `metres(1) + feet(1)` is **not** a TypeScript error; `+`
  yields unbranded `number`. Safety is assignment. Do not wrap in objects (ADR 0008:
  numbers stay numbers). Knots are `1852/3600`, never `0.514444`. See
  `docs/progress/FLY-018.md`.
- **Ack:** 1:1 table `safety_acknowledgement`, not columns on Better Auth `user`. Version
  `safety-1.1`. Proxy is cookie-only; the real gate is `plan/page.tsx`.
- **PWA:** `@serwist/next` 9.5.12 is a webpack plugin. Production is
  `next build --webpack`. Dev stays Turbopack with the worker disabled. Do not add
  `@serwist/turbopack` without a catalog pin + ADR. Map tiles / OpenAIP / PMTiles are
  `NetworkOnly` **before** `defaultCache`. iOS: no install prompt.
- **Docker:** prod compose is a **complete** file, not a `!reset` overlay. CD pushes
  **web only** (`ghcr.io/czekanskyy/flyte-web`). PDF stub is built from
  `docker/pdf-stub` on the NAS. No Neon **main** URL in `.env.local`.
- **Attribution:** ADR 0009. No credits on printouts. `/credits` is authenticated (D-004).
- **Glass:** ADR 0014. Night is red glass. Default theme dark.

### Rejected (do not retry)

- `@ts-expect-error` on `metres(1) + feet(1)` – unused, the expression type-checks.
- Default Serwist `defaultCache` as-is – it would cache OSM `.png` tiles.
- Adding `@serwist/turbopack` / `@serwist/cli` this phase.
- Putting ack fields on `user`.
- CD deploying to TrueNAS from Actions.
- A second GHCR image for the PDF stub this PR.

### Watch out

- **Review your own predecessor's PR.** #15 was authored this session. You have fresh
  context; the outgoing agent does not.
- **Backlog frontmatter was stale** (015/016/018/019 sat at in-review after merge).
  Trust `git log origin/main` and `gh pr list`, then `pnpm backlog:sync`.
- `apps/web/next-env.d.ts`: `next build` injects `.next/types` imports. Do not commit.
- `.gitignore` `public/sw.js` does **not** match `apps/web/public/sw.js`. Both patterns
  exist. ESLint `globalIgnores` must list the generated SW or `pnpm lint` fails after
  build.
- Web `tsconfig.json` must **not** include `.next/types/**/*.ts` – races with a parallel
  `next build` in `pnpm verify`.
- `drizzle-kit generate` names migrations Marvel-style (`0002_wide_mandrill`). Rename to
  `NNNN_flyXXX_*` and the journal tag before commit.
- Stacking squash-merges: rebase with `--onto origin/main <parent-of-feature-commits>`.
- Docker Desktop engine was down (`dockerDesktopLinuxEngine` pipe missing). Compose CLI
  v5.3.1 is installed. First `docker compose build flyte-web` is the Alpine + argon2 test.
- Dockerfile `CMD` is `node apps/web/server.js` because `outputFileTracingRoot` is the
  repo root. Do not change that without re-checking the standalone tree.
- Email enumeration on `/api/login/email-status` is an explicit owner UX request. Do not
  "fix" it. That route must **not** live under `/api/auth/` (Better Auth catch-all).

### Next concrete step

1. Review https://github.com/czekanskyy/flyte/pull/15 against CONTRIBUTING.md and
   `docs/ARCHITECTURE.md` §11. If the engine is up: `docker compose build flyte-web` and
   curl `/api/health`.
2. Approve or request changes. Owner squash-merges.
3. Owner: GHCR pull on TrueNAS, compose, tunnel (`OWNER_SETUP.md`).
4. Owner: Phase 1 checklist in `docs/PILOT_VALIDATION.md`.
5. Do **not** start Phase 2 until that checklist is done (HANDOFF.md §9). Phase 2 is the
   logbook.

Progress files for this landing: `docs/progress/FLY-016.md`, `FLY-017.md`, `FLY-018.md`,
`FLY-019.md`. Read those before touching those areas.
