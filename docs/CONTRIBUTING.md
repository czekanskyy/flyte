# CONTRIBUTING.md

Conventions for humans and agents working on Flyte. Agents should read [`AGENTS.md`](../AGENTS.md)
first — it is the operating manual; this file is the reference.

---

## Getting set up

```bash
pnpm install
cp .env.example .env.local        # fill in — see docs/DATA_SOURCES.md §11
pnpm db:migrate
pnpm dev
```

Requirements: Node ≥ 20.9 (24 or 25 recommended), pnpm 11, Docker for the PDF service.

---

## Branches

```
lane-a/FLY-123-wind-triangle
lane-b/FLY-124-logbook-table
```

`lane-<a|b>/` identifies which parallel agent lane owns the work ([`LANES.md`](LANES.md)), then the
task id, then a short slug. Solo human work may use `feat/`, `fix/`, `docs/` or `chore/` instead.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/), scope = package or feature:

```
feat(aviation): add WMM 2025 declination model
fix(logbook): correct night totals across UTC midnight
docs(domain): document contingency fuel rule with NCO citation
test(aviation): add golden vectors for density altitude
chore(deps): add geographiclib-geodesic to catalog
refactor(map): extract airspace layer builder
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `chore`, `ci`.

Subject in the imperative, lower case, no trailing period. Explain *why* in the body when it is not
obvious; the diff already shows *what*.

Breaking changes get `!` and a `BREAKING CHANGE:` footer:

```
feat(aviation)!: switch internal altitudes to metres

BREAKING CHANGE: all altitude APIs now take and return Metres, not Feet.
Callers must convert at the UI boundary.
```

## Pull requests

One task, one PR. Target **under 400 changed lines**; over 800 will be sent back to be split — a
reviewer cannot meaningfully check a 2000-line diff, and pretending otherwise is how defects get in.

```bash
gh pr create --fill --base main --label "lane-a,phase-3"
gh pr checks --watch
```

Fill in **every** section of the template, including the aviation checklist. An unticked box is
fine and informative; a ticked box that is not true is a problem.

### Review

- **Cross-lane:** Lane A reviews Lane B and vice versa. Nobody reviews their own work.
- Reviewers check against [`DOMAIN.md`](DOMAIN.md), not against intuition. "That looks about right"
  is not a review of a navigation formula.
- The **Aviation validator** role can block a merge on formula grounds alone.
- Merge is **squash only**, PR title as the commit message. `main` stays linear and deployable.

### What a reviewer must verify

1. Every formula traces to `DOMAIN.md` with a citation.
2. Golden vectors exist, and their `source` names something external.
3. Units are SI internally, converted only at the boundary.
4. No new `any`, no unexplained `@ts-ignore`.
5. Safety requirements respected — freshness, rounding direction, no silent fallbacks.
6. Both `pl` and `en` translations present.
7. Only paths in the task's `owns_paths` were touched.
8. New dependencies have an ADR.

## Code style

Prettier and ESLint are authoritative and run in CI; do not argue with them in review.

Beyond that:

- **Names say what, not how.** `calculateWindCorrectionAngle`, not `calcWCA` — this codebase is read
  by people learning the domain.
- **Aviation abbreviations are fine in types and in the UI** where they are the standard term:
  `TAS`, `QNH`, `ADEP`. Spell them out in function names.
- **Comments explain why.** The formula is in `DOMAIN.md`; the comment explains why this code
  applies it the way it does.
- **Every function in `packages/aviation` gets a doc comment** linking its `DOMAIN.md` section:

```ts
/**
 * Solves the wind triangle for a leg.
 *
 * @see docs/DOMAIN.md §6.2
 * @returns null when no solution exists (wind exceeds TAS across the track).
 */
```

- **Errors are values, not exceptions**, in the calculation engine. Return a discriminated union;
  never throw, never return `NaN`.

## Dependencies

- Added to `pnpm-workspace.yaml` under `catalog:`, referenced as `"catalog:"` in package files.
- **Lane A alone** edits the catalog during parallel work.
- Every new dependency needs an ADR covering: what problem it solves, what was considered, bundle
  cost, maintenance status, licence.
- Treat bundle size as a budget, not an afterthought — this application is opened on a phone on an
  airfield, sometimes on a bad connection. `size-limit` runs in CI.

## Database changes

```bash
pnpm db:generate        # produce a migration from the schema change
# rename it: NNNN_flyXXX_short_description.sql
pnpm db:migrate         # apply to your lane's Neon branch
```

Migrations are forward-only and never edited once merged. Schema files are split per domain so two
lanes rarely touch the same file.

## Translations

Every user-visible string goes through `next-intl` with keys in **both** `messages/pl/<module>.json`
and `messages/en/<module>.json`. A missing key fails CI.

Polish is the primary language — write it first, then English. Use correct Polish aviation
terminology; the glossary is in [`DOMAIN.md`](DOMAIN.md) §1.

## Documentation

Update it in the same PR as the code, never "later":

| Change | Also update |
|---|---|
| New formula or constant | `DOMAIN.md`, with a citation |
| New or changed external API | `DATA_SOURCES.md` |
| Architectural decision | a new `docs/adr/NNNN-*.md` |
| Safety-relevant behaviour | `SAFETY.md` and its test mapping |
| Anything an agent must know | `AGENTS.md` |
| Task completed | `docs/progress/FLY-XXX.md`, and `status:` in the task file |

## Reporting a safety defect

Not an ordinary bug. See [`SAFETY.md`](SAFETY.md) §10: label it `safety`, open the issue before
attempting a fix, add a reproducing golden vector first, and never adjust a vector to make a test
pass.
