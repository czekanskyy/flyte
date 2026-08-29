# ADR 0013 – shadcn/ui copy-in kit in `packages/ui`

**Status:** Accepted · **Date:** 2026-08-29 · **Supersedes:** – · **Superseded by:** –

## Context

The app needs a shared component kit: Button, Input, Label, a theme provider, and later
dialogs, tables and form controls. Options checked for a greenfield React 19 / Tailwind 4
tree:

- **Hand-rolled only** – total control, but every later agent invents a different button.
- **A paid kit** (Tailwind UI, MUI Premium) – lock-in, licence friction, and a visual
  language we do not own.
- **shadcn/ui** – copies source into the repo. No black-box runtime, MIT, works with CSS
  variables, current CLI targets Tailwind 4.

The owner visual language is glassmorphism ([ADR 0014](0014-glassmorphism.md)). The shadcn
CLI's default zinc/neutral theme fights that. The kit is the *structure*; the material is
our tokens.

## Decision

Components live in `packages/ui` and are imported as `@flyte/ui`. Apps do not grow a
private `components/ui`. Source is copied in (shadcn pattern), then restyled to the glass
tokens. The CLI default theme is not used.

This PR ships Button, Input, Label and ThemeProvider as copy-in primitives styled by
`packages/ui/src/styles.css`. Tailwind 4 stays in the catalog for later components. New
catalog packages for a CLI add (`class-variance-authority`, `clsx`, `tailwind-merge`,
Radix primitives) wait until a component actually needs them; they will be pinned with
`npm view` in the PR that adds them.

Licence: MIT (shadcn, Radix). lucide-react is already in the catalog (ADR 0001).

## Consequences

- Visual changes go through tokens, not one-off hex in a screen.
- A later `pnpm dlx shadcn@latest add …` must retarget the new file at `packages/ui` and
  replace zinc colours with glass tokens before merge.
- Theme is `data-theme` on `<html>`: `light` | `dark` | `night`.
