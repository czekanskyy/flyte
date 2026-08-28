# AGENTS.md — Flyte

**Read this file completely before your first edit. It is not a style guide; it is the operating
manual for a project where a wrong number can hurt someone.**

Flyte is an Electronic Flight Bag (EFB) for student pilots and general-aviation pilots in Poland.
Pilots will use its output — fuel figures, safe altitudes, weight-and-balance results — to make
real go/no-go decisions in real aircraft. Treat every calculation accordingly.

---

## 0. The five rules that override everything else

1. **Never invent an aviation formula, constant, or default.**
   If it is not in [`docs/DOMAIN.md`](docs/DOMAIN.md) with a cited source, you may not implement it.
   Add it there first — with the citation — then implement.

2. **Never guess a value.** Fuel density, reserve minima, terrain clearance margin, ICAO type
   designator, magnetic model epoch — if you do not *know* it from a cited source, write
   `// TODO(FLY-XXX): needs verification — <what exactly is unknown>`, add a line to
   [`docs/DECISIONS_PENDING.md`](docs/DECISIONS_PENDING.md), and say so in your PR description.
   A visible gap is safe. A plausible-looking wrong number is not.

3. **Every new public function in `packages/aviation` needs a golden test vector**
   computed by hand or taken from an authoritative source. No vector, no merge.

4. **Stay inside `owns_paths`.** Your task file declares which paths you own. Another agent is
   working in this repository right now. If you need to touch anything outside your paths, **stop
   and report** — do not "just quickly fix" it.

5. **`pnpm verify` must pass before you open a PR.** Not "should" — must.

---

## 1. What you are working on

| | |
|---|---|
| **Stack** | Next.js 16 · React 19 · TypeScript 6.0.3 · Tailwind 4 · MapLibre GL 6 · Drizzle + Neon Postgres/PostGIS · Better Auth |
| **Package manager** | pnpm 11 (workspaces + `catalog:`) with Turborepo |
| **Repo shape** | monorepo — `apps/web`, `packages/{aviation,aviation-data,db,ui,config}` |
| **Deploy** | Docker Compose on TrueNAS behind Cloudflare Tunnel → `flyte.czekanski.dev` |
| **Language** | Code, comments, docs, commits, PRs: **English**. UI: **Polish + English** via `next-intl` |

Start here: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how the pieces fit,
[`docs/DOMAIN.md`](docs/DOMAIN.md) for the aviation rules and formulas.

---

## 2. Architectural boundaries (mechanically enforced)

```
apps/web  ──▶  packages/ui
    │              │
    ├──────────────┼──▶ packages/aviation-data ──▶ packages/aviation
    │              │              (ports + adapters)      (pure math)
    └──────────────┴──▶ packages/db
```

**`packages/aviation` is the safety-critical core. It must not import:**
`react`, `next`, anything from `apps/*`, any HTTP client, any filesystem or database access.

It takes numbers and returns numbers. It must run in bare Node and its full test suite must finish
in under a second. `eslint-plugin-boundaries` enforces this — if you find yourself fighting the
lint rule, you are solving the problem in the wrong package.

**Why this matters:** it is the only part of the codebase that can be exhaustively tested against
hand-computed values. Keeping I/O out of it is what makes that possible.

---

## 3. Units — the single most common source of aviation software bugs

**Everything inside the codebase is SI: metres, metres/second, kilograms, kelvin, pascal, seconds,
radians.** Conversion to knots, feet, litres, °C, hPa happens **only** at the UI boundary and only
through `packages/aviation/units`.

Units are branded types. This will not compile, and that is the point:

```ts
const altitude: Feet = 3000 as Feet;
const distance: Metres = 5000 as Metres;
const nonsense = altitude + distance;  // ✗ Type error — good.
```

Rules:
- Never write a bare numeric literal for a physical quantity. Use a constructor: `feet(3000)`.
- Never display a number without its unit. `120` is a bug; `120 kt` is a value.
- Never do arithmetic on display-unit values. Convert in, compute, convert out.

---

## 4. Task workflow

Your task lives in `docs/backlog/FLY-XXX-*.md`. It is self-contained: you should not need any
previous conversation to execute it.

```
1. Read the task file, and every doc it references.
2. Read docs/LANES.md — confirm which paths you own this phase.
3. Set status: in-progress in the task file.
4. git checkout -b lane-<a|b>/FLY-XXX-<slug>
5. Write the test first when the behaviour is numeric. Golden vectors before implementation.
6. Implement. Stay inside owns_paths.
7. pnpm verify
8. Write docs/progress/FLY-XXX.md
9. gh pr create --fill --base main
10. Set status: in-review
```

If you discover the task is wrong, under-specified, or larger than one session: **stop, write down
what you found in the task file, and report.** Do not expand scope silently. An `estimate: L` task
is a planning error — ask for it to be split.

---

## 5. Two agents work here simultaneously

This repo is worked by two parallel CLI agents in separate git worktrees, each with its own Neon
database branch. [`docs/LANES.md`](docs/LANES.md) is the authoritative ownership table for the
current phase.

Conflict-prone files and the rules that keep them calm:

| File | Rule |
|---|---|
| `pnpm-workspace.yaml` (`catalog:`) | **Lane A only.** Lane B files a `chore(deps)` task instead |
| `pnpm-lock.yaml` | Never hand-merge. After rebase: `pnpm install` |
| `docs/BACKLOG.md` | **Generated** by `pnpm backlog:sync`. Never edit by hand — truth lives in task frontmatter |
| Progress notes | One file per task: `docs/progress/FLY-XXX.md`. Never a shared log |
| Drizzle migrations | Name them `NNNN_flyXXX_description.sql` so collisions are loud, not silent |
| DB schema | Split per domain: `packages/db/src/schema/{auth,logbook,aip,routes}.ts` |
| i18n messages | Split per module: `messages/{pl,en}/<module>.json` |

**When two lanes must meet** (one builds a data adapter, the other the UI that consumes it), a
short *contract-first* task lands the TypeScript interfaces in
`packages/aviation-data/src/ports/` on `main` **before** the lanes diverge. Both then code against
the same interface.

---

## 6. Testing

See [`docs/TESTING.md`](docs/TESTING.md) for the full policy. The short version:

| Layer | Tool | Applies to |
|---|---|---|
| Golden vectors | Vitest | Every public function in `packages/aviation` |
| Property-based | fast-check | Anything with mathematical invariants |
| Unit | Vitest | Business logic, parsers, validators |
| Component | Testing Library | Interactive UI |
| E2E | Playwright | The seven critical journeys in `docs/TESTING.md` |
| Visual regression | Playwright screenshots | Every print/PDF template |

A golden vector looks like this — note that `source` is mandatory:

```json
{
  "id": "wind-triangle-001",
  "source": "Manual E6B computation, cross-checked against ASA CX-3",
  "given":  { "tc_deg": 90, "tas_kt": 100, "wind_dir_deg": 40, "wind_kt": 20 },
  "expect": { "wca_deg": -7.4, "th_deg": 82.6, "gs_kt": 84.6 },
  "tolerance": 0.15
}
```

**Never adjust a golden vector to make a failing test pass.** If implementation and vector
disagree, one of them is wrong and a pilot needs to know which. Escalate.

---

## 7. Safety requirements in code

These are functional requirements, not decoration. See [`docs/SAFETY.md`](docs/SAFETY.md).

- Weather and NOTAM data must render through `<DataFreshness/>`, which shows age and turns red past
  its threshold (METAR > 60 min, TAF > 6 h, or any cached-offline value).
- An expired AIRAC cycle must raise a persistent banner.
- Safe altitude always rounds **up**, and the applied margin is always displayed.
- The first-run acknowledgement must be accepted before any planning feature is usable.

## 8. Attribution policy — read before touching any print template

Deliberate project decision, recorded in [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md):

- **No attribution or licence text on printed output.** OFP and FPL printouts must match the
  training organisation's template exactly; extra elements make them unusable.
- **In-app attribution only on views that actually consume OpenAIP data** — map, route editor, the
  route section of the OFP, FPL. Logbook, E6B, settings and account show nothing.
- `/credits` carries the full legal detail.

If you think this is wrong: it was decided by the project owner with the licence terms in front of
them. Do not "fix" it.

---

## 9. Conventions

**Commits** — Conventional Commits, scope = package:
```
feat(aviation): add WMM 2025 declination model
fix(logbook): correct night-time totals across UTC midnight
docs(domain): document contingency fuel rule with NCO citation
```

**Branches** — `lane-a/FLY-123-wind-triangle`, `lane-b/FLY-124-logbook-table`

**Merges** — squash only. `main` stays linear and always deployable.

**TypeScript**
- No `any`. No `@ts-ignore` without `// FLY-XXX: <reason>`.
- `strict` plus `noUncheckedIndexedAccess` are on. Handle the `undefined`.
- Dependencies come from `catalog:` only. A new dependency needs an ADR.

**React / Next**
- Server Components by default; `'use client'` only where interactivity requires it.
- Every user-visible string goes through `next-intl` with **both** `pl` and `en` keys. No hardcoded text.
- Mobile-first. Test at 375 px. Touch targets ≥ 44 px — this gets used outdoors, in gloves, in sunlight.

**Pull requests** — fill in every section of the template, including the aviation checklist.
Target under 400 changed lines; over 800 will be sent back to be split.

---

## 10. Commands

```bash
pnpm install              # install (frozen in CI)
pnpm dev                  # all dev servers
pnpm verify               # typecheck + lint + test + build — the pre-PR gate
pnpm test                 # unit + golden vectors
pnpm test:vectors         # golden vectors only
pnpm test:e2e             # Playwright
pnpm db:generate          # generate a Drizzle migration
pnpm db:migrate           # apply migrations
pnpm backlog:sync         # regenerate docs/BACKLOG.md from task frontmatter
```

---

## 11. When to stop and ask

Stop and report rather than guessing when:

- A formula or constant is missing from `docs/DOMAIN.md`.
- The task requires touching paths you do not own.
- A golden vector disagrees with your implementation and you cannot determine which is right.
- An external API behaves differently from what `docs/DATA_SOURCES.md` documents.
- Real POH data is needed and only placeholder values are available.
- The task turns out to be substantially larger than one session.

Reporting a blocker costs one message. A plausible wrong number can survive all the way to
somebody's kneeboard.
