---
id: FLY-016
title: "PWA: Serwist, manifest, icons"
status: done
phase: 1
depends_on: [FLY-013]
owns_paths:
  - apps/web/src/**
  - apps/web/public/**
  - apps/web/package.json
  - apps/web/next.config.ts
  - apps/web/next.config.mjs
  - apps/web/serwist.config.ts
  - apps/web/tsconfig.json
  - messages/pl/pwa.json
  - messages/en/pwa.json
  - pnpm-lock.yaml
  - docs/progress/FLY-016.md
  - docs/backlog/FLY-016-pwa-serwist.md
  - docs/BACKLOG.md
  - .gitignore
  - packages/config/eslint.js
estimate: M
---

## Goal

The app is installable as a PWA on desktop and Android. The shell precaches. Map tiles are
**not** cached. Generated service-worker files stay gitignored.

## Context

[`docs/PRD.md`](../PRD.md) §6: installable on Android, iOS and desktop; Lighthouse PWA ≥ 95
is a Phase 8 target, not this task's gate. [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) §5:
Serwist for the shell; map tiles deliberately not cached in v1.

`serwist` / `@serwist/next` 9.5.12, chosen because it works with Turbopack (`next-pwa` still
wants webpack) – ADR 0001.

Icons: produce a simple, original mark (not a copied logo). Need at least 192 and 512 PNG,
plus an `apple-touch-icon`. Do not scrape a third-party icon. A geometric "F" or a stylised
wing on a dark field is enough; this is not a branding exercise.

iOS PWA limitations (no install prompt, add-to-home-screen only) are acceptable. Document
them in the progress file, not in a user-facing apology.

`.gitignore` already lists `public/sw.js` and Serwist worker artifacts. Keep it that way.

## Acceptance criteria

- [ ] Web app manifest: name Flyte, `display: standalone`, `start_url` that includes locale
      or resolves to the default, theme colour aligned with the light theme.
- [ ] Icons 192, 512, apple-touch-icon, committed under `apps/web/public/`.
- [ ] Serwist service worker registered in production builds. Precache the app shell.
- [ ] Runtime caching does **not** include map tiles, OpenAIP, or any `*.pmtiles` / OSM
      raster. If a default Serwist recipe would cache those, override it.
- [ ] Offline: a previously loaded `(app)` shell still opens (may show a simple offline
      fallback). Do not claim logbook-offline – that is Phase 2.
- [ ] `pnpm verify` / `next build` succeeds. SW files are not committed.
- [ ] `docs/progress/FLY-016.md` written.

## Test plan

- Production build (`pnpm --filter web build`). Chromium: Application → Manifest, SW
  registered. "Add to desktop" or equivalent works on the implementer's machine.
- Lighthouse PWA score is informational. Do not fail the task on < 95.
- Confirm a request to a hypothetical tile URL is not intercepted for cache-first (a unit
  test on the Serwist config is better than hoping).

## Out of scope

- Dexie, TanStack Query persistence, outbox (Phase 2).
- Offline map tiles (v1 out of scope).
- Push notifications.
- Maskable icon perfection and store screenshots.

## References

ADR 0001 (Serwist) · `docs/ARCHITECTURE.md` §5 · `docs/PRD.md` §6 PWA · `.gitignore` (PWA
generated files)
