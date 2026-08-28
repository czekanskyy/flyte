# LANES.md — parallel agent ownership

Two CLI agents work this repository at the same time. This file is the **authoritative ownership
table**. If a path is not listed as yours, you do not touch it.

Rewritten by the Architect at the start of every phase.

---

## How the two lanes are set up

### Worktrees, not clones

```bash
# Lane A works in the primary checkout
cd C:/Users/Dominik/Dev/flyte

# Lane B gets its own working directory sharing the same object store
git worktree add C:/Users/Dominik/Dev/flyte-lane-b -b lane-b/FLY-XXX
```

Two worktrees share history and objects but have separate indexes, so neither agent ever blocks the
other on `index.lock`. Two clones would work but would need pushing and fetching to exchange
anything.

### Separate Neon database branches

Each lane gets its own branch of the database, taken from `main`:

```bash
neon branches create --name lane-a --parent main
neon branches create --name lane-b --parent main
```

Each lane's `.env.local` points `DATABASE_URL` at its own branch. One agent's migration can then
never break the other's running app. Reset a lane's branch from `main` at any time — it is free and
instant.

### Separate ports

Lane A dev server on `3000`, Lane B on `3001`. Set `PORT` in each `.env.local`.

---

## Rules

1. **Only touch paths you own.** Need something outside them? Stop and report. Do not "quickly fix".
2. **Lane A alone edits `pnpm-workspace.yaml`** (the dependency catalog). Lane B raises a
   `chore(deps)` task instead.
3. **Never hand-merge `pnpm-lock.yaml`.** After a rebase, delete the conflict and run `pnpm install`.
4. **`docs/BACKLOG.md` is generated.** Run `pnpm backlog:sync`; never edit it directly. The truth
   lives in each task file's frontmatter.
5. **One progress file per task** — `docs/progress/FLY-XXX.md`. There is no shared progress log,
   precisely so there is nothing to conflict on.
6. **Migrations carry their task id** — `0007_fly042_add_logbook_totals.sql`. Two lanes adding
   `0007_*` produces a visible filename clash rather than a silent ordering bug.
7. **Cross-lane review.** Lane A reviews Lane B's pull requests and vice versa. Nobody reviews
   their own.

## Files that are split specifically to avoid conflicts

| Instead of | Use |
|---|---|
| `packages/db/src/schema.ts` | `schema/auth.ts`, `schema/logbook.ts`, `schema/aip.ts`, `schema/routes.ts`, `schema/settings.ts` |
| `messages/pl.json` | `messages/pl/<module>.json`, one per feature |
| `docs/PROGRESS.md` | `docs/progress/FLY-XXX.md` |
| A hand-maintained backlog table | Task-file frontmatter + `pnpm backlog:sync` |

## Contract-first, when the lanes must meet

When one lane builds something the other consumes — a data adapter and the UI that uses it — do
**not** let both improvise and reconcile later.

1. A short task lands the TypeScript interfaces alone in
   `packages/aviation-data/src/ports/` (or the relevant package).
2. That merges to `main` **before** either lane starts the dependent work.
3. Both lanes then code against the same committed interface, and integration is a merge rather
   than a negotiation.

## Sync points

At the end of each phase:

1. Both lanes merged to `main`, CI green.
2. Architect rewrites this file for the next phase.
3. Architect writes the next phase's task files.
4. `pnpm backlog:sync`.
5. Both lanes reset their Neon branches from `main`.

---

# Current assignment

## Phase 0 — Documentation and repository bootstrap · **active**

| Lane | Owns paths | Tasks | Branch |
|---|---|---|---|
| A | `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DOMAIN.md`, `docs/DATA_SOURCES.md`, `docs/SAFETY.md`, `docs/MAINTENANCE.md`, `docs/adr/**` | FLY-003 … FLY-006 | `lane-a/FLY-003` |
| B | `AGENTS.md`, `docs/AGENT_WORKFLOW.md`, `docs/LANES.md`, `docs/CONTRIBUTING.md`, `docs/TESTING.md`, `docs/DESIGN_SYSTEM.md`, `.github/**`, `docs/backlog/**` | FLY-007 … FLY-010 | `lane-b/FLY-007` |

**Frozen this phase:** `.gitignore`, `.gitattributes`, `README.md` — owner-maintained.

**Blocking, before anything else:** **FLY-002** — verify FAA NOTAM coverage for `EP**`. Assigned to
whichever lane is free first. No NOTAM code may be written until it reports.

---

## Phase 1 — Foundation · planned

| Lane | Owns paths |
|---|---|
| A | `pnpm-workspace.yaml`, `turbo.json`, `packages/config/**`, `packages/db/**`, `apps/web/src/app/[locale]/(auth)/**`, `apps/web/src/lib/auth/**`, `docker/**`, `.github/workflows/**` |
| B | `apps/web/src/app/[locale]/(app)/**`, `apps/web/src/app/[locale]/layout.tsx`, `packages/ui/**`, `apps/web/src/styles/**`, `messages/**`, `apps/web/src/sw.ts`, `packages/aviation/src/units/**` |

**Contract-first task before the split:** `packages/db/src/schema/auth.ts` and the session helper
signature, so Lane B can build the app shell against a known auth surface.

## Phase 2+3 — Logbook ‖ Calculation engine · planned

| Lane | Owns paths |
|---|---|
| A | `packages/aviation/**` (all modules except `units`, plus the E6B engine), `apps/web/src/features/e6b/**` |
| B | `packages/db/src/schema/logbook.ts`, `apps/web/src/features/logbook/**`, `apps/web/src/print/logbook/**`, `messages/*/logbook.json` |

The cleanest split in the project: pure mathematics on one side, data-driven UI on the other, no
shared files at all.
