---
id: FLY-015
title: "packages/ui, theme system, red night mode"
status: done
phase: 1
depends_on: [FLY-013]
owns_paths:
  - packages/ui/**
  - apps/web/src/app/globals.css
  - apps/web/src/app/[locale]/(app)/**
  - messages/pl/theme.json
  - messages/en/theme.json
  - docs/adr/0013-shadcn-ui.md
  - docs/adr/0014-glassmorphism.md
  - docs/adr/README.md
  - docs/progress/FLY-015.md
  - docs/backlog/FLY-015-ui-theme-night.md
  - docs/BACKLOG.md
  - pnpm-workspace.yaml
  - pnpm-lock.yaml
  - package.json
estimate: M
---

## Goal

`packages/ui` is a shadcn-style copy-in kit. The visual language is **glassmorphism**
([ADR 0014](../adr/0014-glassmorphism.md)): translucent, blurred chrome in the manner of
current Apple system UI. The app has light, dark, and **red night** themes, with tokens for
accent, radius, density, font size and glass fill. Night mode is actually red, not dark-grey.

## Context

[`docs/PRD.md`](../PRD.md) §5.6: theme, accent colour, transparency, corner radius, density
and font size, including a red night mode. Night mode exists so a cockpit at night does not
get a white flash; red preserves dark adaptation better than a generic dark theme.

shadcn/ui copies source into the repo. Components live in `packages/ui`, not in `apps/web`.
Tailwind 4 – do not copy a Tailwind 3 `tailwind.config.js` recipe. Use the current shadcn
init for Tailwind 4 on the day you implement.

Write [ADR 0013](../adr/0013-shadcn-ui.md) in this PR: why shadcn (copy-in components, no
black-box kit, works with our tokens), what was considered (hand-rolled, a paid kit), and
list every new catalog dependency with `npm view` versions (typically `class-variance-authority`,
`clsx`, `tailwind-merge`, and the Radix / Base UI primitives shadcn current uses). Licence:
MIT.

A full settings page is Phase 8. This task ships **tokens + a way to toggle night mode**
(class on `<html>`, e.g. `data-theme="night"`). Persistence can be `localStorage` for now;
user-settings table is Phase 8 unless FLY-014 already has a JSON settings column you can
reuse without migrating.

Touch targets ≥ 44 px. Contrast: night mode must remain readable. WCAG audit is Phase 8;
do not ship white-on-red that fails a basic check.

## Acceptance criteria

- [x] ADR 0013 written and indexed from `docs/adr/README.md`.
- [x] `packages/ui` exports at least Button, Input, Label, and a ThemeProvider (names may
      follow shadcn). Apps import from `@flyte/ui`, not from a local `components/ui`.
- [x] CSS variables for background, foreground, accent, radius, density, font-size, and glass
      fill / blur / border.
- [x] Surfaces use the glass material (ADR 0014), including login. Not flat grey slabs.
- [x] Three named themes: `light`, `dark`, `night`. Night uses red tones on a near-black
      background, not a rebadged `dark`.
- [x] A control in the `(app)` shell switches themes, including night. Usable at 375 px,
      ≥ 44 px.
- [x] Copy through next-intl (`theme.json` in both languages).
- [x] `pnpm verify` green.
- [x] `docs/progress/FLY-015.md` written.

## Test plan

- Component test: theme switcher changes `data-theme` (or equivalent) on the root.
- Manual: 375 px screenshot is not required in CI yet; note in the PR that you looked at
  375 px. Visual regression is Phase 8.

## Out of scope

- Per-quantity unit preferences (Phase 8, needs FLY-018 first).
- Full settings page, accent-colour picker, transparency slider – tokens must exist so
  Phase 8 has something to bind; the sliders themselves wait.
- PWA (FLY-016).
- Auth pages must not break; restyle them only if they already consume `@flyte/ui`.

## References

`docs/PRD.md` §5.6 · `docs/ARCHITECTURE.md` §1 · ADR 0001 (Tailwind 4.3.3) ·
`docs/CONTRIBUTING.md` (mobile-first, 44 px)
