---
id: FLY-013
title: "Next.js App Router shell and next-intl (PL/EN)"
status: todo
phase: 1
depends_on: [FLY-011]
owns_paths:
  - apps/web/**
  - messages/**
  - package.json
  - pnpm-workspace.yaml
  - pnpm-lock.yaml
  - packages/config/**
  - docs/progress/FLY-013.md
  - docs/backlog/FLY-013-next-app-i18n.md
  - docs/BACKLOG.md
estimate: M
---

## Goal

`pnpm --filter web dev` serves a Next.js 16 App Router app with Polish as the default locale,
English as the second, a `(auth)` layout, an `(app)` layout, and a `/api/health` route. Every
user-visible string goes through `next-intl`.

## Context

FLY-010 left `apps/web` as a skeleton. FLY-011 left shared lint/tsconfig. This task turns the
skeleton into a real Next.js app.

Stack: Next.js **16.3.3**, React **19.2.8**, `next-intl` **4.14.1**, TypeScript 6.0.3. App
Router. Server Components by default; `'use client'` only where interaction requires it.

Locale routing: `[locale]` segment, default **`pl`**, other `en`. Polish is written first,
then English. No hardcoded UI strings – `pnpm lint` / a test should fail a missing key if you
can do that cheaply; otherwise be strict by convention and a CI grep is not required yet.

Layouts:

- `app/[locale]/(auth)/…` – unauthenticated pages (sign-in lands in FLY-014; this task can
  leave a placeholder "Sign in" that uses i18n keys).
- `app/[locale]/(app)/…` – authenticated shell (a home placeholder is enough).
- Do not implement real session gating here; FLY-014 wires Better Auth.

Health: `GET /api/health` returns JSON `{ "ok": true }` (no secrets, no DB required so CI
can hit it without Neon).

Messages live in `messages/pl/*.json` and `messages/en/*.json`, split per module from day one
(`common.json` now). House style: no U+2014 in copy; use en-dashes.

Do not add shadcn, a theme switcher, PWA, or auth logic.

## Acceptance criteria

- [ ] Next.js 16 app boots with Turbopack (`pnpm --filter web dev` or `pnpm dev`).
- [ ] `/pl` (or `/`) renders a Polish placeholder home. `/en` renders the English equivalent.
- [ ] Switching locale is possible (a language control, even a pair of links).
- [ ] `(auth)` and `(app)` route groups exist.
- [ ] `GET /api/health` returns 200 `{ "ok": true }`.
- [ ] Both `messages/pl/common.json` and `messages/en/common.json` exist; no hardcoded
      user-visible strings in TSX.
- [ ] `pnpm verify` includes `apps/web` typecheck, lint and build (`next build`).
- [ ] Mobile-first: the placeholder is usable at 375 px. No 44 px requirement until there are
      real controls; if you add a language control, it is ≥ 44 px.
- [ ] If `eslint-config-next` is added, catalog pin from `npm view` the same day, row on
      ADR 0001. Same for any other new dependency.
- [ ] `docs/progress/FLY-013.md` written.

## Test plan

- `pnpm --filter web build` succeeds.
- A Vitest or Playwright smoke is optional. A route-handler unit test for `/api/health` is
  welcome and small.
- Manually (or via `next start` + curl): `/pl`, `/en`, `/api/health`.

## Out of scope

- Better Auth (FLY-014).
- `packages/ui`, theming, night mode (FLY-015).
- Serwist / manifest (FLY-016).
- First-run acknowledgement (FLY-019).
- Map, logbook, OFP.

## References

`docs/ARCHITECTURE.md` §6 · ADR 0001 · `docs/CONTRIBUTING.md` (i18n) ·
`docs/PRD.md` §5.6, §6 internationalisation
