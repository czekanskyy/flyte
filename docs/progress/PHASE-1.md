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
