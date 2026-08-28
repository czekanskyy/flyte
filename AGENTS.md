# AGENTS.md – Flyte

**Read this file completely before your first edit. It is not a style guide; it is the operating
manual for a project where a wrong number can hurt someone.**

Flyte is an Electronic Flight Bag (EFB) for student pilots and general-aviation pilots in Poland.
Pilots will use its output – fuel figures, safe altitudes, weight-and-balance results – to make
real go/no-go decisions in real aircraft. Treat every calculation accordingly.

---

## 0. The five rules that override everything else

1. **Never invent an aviation formula, constant, or default.**
   If it is not in [`docs/DOMAIN.md`](docs/DOMAIN.md) with a cited source, you may not implement it.
   Add it there first – with the citation – then implement.

2. **Never guess a value.** Fuel density, reserve minima, terrain clearance margin, ICAO type
   designator, magnetic model epoch – if you do not *know* it from a cited source, write
   `// TODO(FLY-XXX): needs verification – <what exactly is unknown>`, add a line to
   [`docs/DECISIONS_PENDING.md`](docs/DECISIONS_PENDING.md), and say so in your PR description.
   A visible gap is safe. A plausible-looking wrong number is not.

3. **Every new public function in `packages/aviation` needs a golden test vector**
   computed by hand or taken from an authoritative source. No vector, no merge.

4. **Stay inside `owns_paths`.** Your task file declares which paths it covers. Wandering outside
   them is how a session runs out of budget halfway through a refactor nobody asked for, leaving
   the next agent a mess to inherit. If you need to touch anything outside your paths, **stop and
   report** – do not "just quickly fix" it.

5. **`pnpm verify` must pass before you open a PR.** Not "should" – must.

---

## 1. What you are working on

| | |
|---|---|
| **Stack** | Next.js 16 · React 19 · TypeScript 6.0.3 · Tailwind 4 · MapLibre GL 6 · Drizzle + Neon Postgres/PostGIS · Better Auth |
| **Package manager** | pnpm 11 (workspaces + `catalog:`) with Turborepo |
| **Repo shape** | monorepo – `apps/web`, `packages/{aviation,aviation-data,db,ui,config}` |
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
in under a second. `eslint-plugin-boundaries` enforces this – if you find yourself fighting the
lint rule, you are solving the problem in the wrong package.

**Why this matters:** it is the only part of the codebase that can be exhaustively tested against
hand-computed values. Keeping I/O out of it is what makes that possible.

---

## 3. Units – the single most common source of aviation software bugs

**Everything inside the codebase is SI: metres, metres/second, kilograms, kelvin, pascal, seconds,
radians.** Conversion to knots, feet, litres, °C, hPa happens **only** at the UI boundary and only
through `packages/aviation/units`.

Units are branded types. This will not compile, and that is the point:

```ts
const altitude: Feet = 3000 as Feet;
const distance: Metres = 5000 as Metres;
const nonsense = altitude + distance;  // ✗ Type error – good.
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
 1. Pick up: git log, git status, git branch -a, gh pr list.
    You are probably not the first agent here - docs/HANDOFF.md §2.
 2. Review the open PR your predecessor left, if there is one. That is your first job.
 3. Read docs/progress/ for this task and the few before it.
 4. Read the task file and every doc it references.
 5. Set status: in-progress in the task file.
 6. git checkout -b <type>/FLY-XXX-<slug>   (or check out the existing task branch)
 7. Write the test first when the behaviour is numeric. Golden vectors before implementation.
 8. Implement. Stay inside owns_paths.
 9. pnpm verify
10. Write docs/progress/FLY-XXX.md - every session, not only at task completion.
11. gh pr create --fill --base main
12. Set status: in-review
```

If you discover the task is wrong, under-specified, or larger than one budget: **stop, write down
what you found in the task file, and report.** Do not expand scope silently. An `estimate: L` task
is a planning error – split it, or ask for it to be split.

---

## 5. You are probably not the first agent on this task

One agent works this repository at a time. When it runs out of context budget, another takes over
from where it stopped. [`docs/HANDOFF.md`](docs/HANDOFF.md) is the full protocol; the essentials:

**Before you write code**, find out what you inherited: `git log`, `git status`, `git branch -a`,
`gh pr list`, then `docs/progress/` for the task and the two or three before it, then `pnpm verify`
to learn whether you are starting green or inheriting a failure.

**Review your predecessor's open PR first.** With one agent at a time there is no second reviewer,
and reviewing your own work is not review. The incoming agent has the one thing the outgoing agent
cannot have - fresh context - so review and onboarding are the same reading. Find a defect in what
you inherited? Say so plainly. The alternative is building on it.

**Keep a reserve and land before you are empty.** At roughly 20 % remaining, take on no new work.
At roughly 10 %, commit, push, and write `docs/progress/FLY-XXX.md`. Finishing one more function
and running dry is worse than stopping one function early with a clean note: the next agent then
pays for both the unfinished function and the missing explanation.

**The handoff note is the deliverable that survives you.** State what is done, what is not, which
approaches you already tried and rejected and why, the next concrete step, and anything that cost
you time to discover. Rejected approaches matter most - the next agent will otherwise find the same
appealing shortcut and spend the same hour on it.

Several conventions in this repository exist to make that handoff cheap: one progress file per
task, self-contained task files, schema and i18n split per module, migrations named
`NNNN_flyXXX_*`, and `docs/BACKLOG.md` generated by `pnpm backlog:sync` rather than hand-edited.

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

A golden vector looks like this – note that `source` is mandatory:

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

## 8. Attribution policy – read before touching any print template

Deliberate project decision, recorded in [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md):

- **No attribution or licence text on printed output.** OFP and FPL printouts must match the
  training organisation's template exactly; extra elements make them unusable.
- **In-app attribution only on views that actually consume OpenAIP data** – map, route editor, the
  route section of the OFP, FPL. Logbook, E6B, settings and account show nothing.
- `/credits` carries the full legal detail.

If you think this is wrong: it was decided by the project owner with the licence terms in front of
them. Do not "fix" it.

---

## 9. Conventions

**Commits** – Conventional Commits, scope = package:
```
feat(aviation): add WMM 2025 declination model
fix(logbook): correct night-time totals across UTC midnight
docs(domain): document contingency fuel rule with NCO citation
```

**Branches** – `feat/FLY-123-wind-triangle`, `fix/FLY-124-night-totals`, `docs/`, `chore/`

**Merges** – squash only. `main` stays linear and always deployable.

**TypeScript**
- No `any`. No `@ts-ignore` without `// FLY-XXX: <reason>`.
- `strict` plus `noUncheckedIndexedAccess` are on. Handle the `undefined`.
- Dependencies come from `catalog:` only. A new dependency needs an ADR.

**React / Next**
- Server Components by default; `'use client'` only where interactivity requires it.
- Every user-visible string goes through `next-intl` with **both** `pl` and `en` keys. No hardcoded text.
- Mobile-first. Test at 375 px. Touch targets ≥ 44 px – this gets used outdoors, in gloves, in sunlight.
- **Visual language is glassmorphism** ([ADR 0014](docs/adr/0014-glassmorphism.md)). Chrome is
  translucent and blurred, large-radius, Apple-like. Do not introduce flat opaque grey as the
  default. Night mode is red glass, not dark-grey. Print templates are exempt.

**Prose – applies to every `.md` file, code comment, commit message and PR description**
- **Never use an em-dash (U+2014). Use an en-dash (U+2013, `–`) instead.** House style, no exceptions.
- The same goes for user-facing copy in `messages/pl/*.json` and `messages/en/*.json`.
- `pnpm lint:prose` fails the build on any U+2014 in the repository.

**Pull requests** – fill in every section of the template, including the aviation checklist.
Target under 400 changed lines; over 800 will be sent back to be split.

---

## 10. Commands

```bash
pnpm install              # install (frozen in CI)
pnpm dev                  # all dev servers
pnpm verify               # typecheck + lint + test + build – the pre-PR gate
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
