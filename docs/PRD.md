# PRD.md — Flyte

**Product:** Flyte — an Electronic Flight Bag for student pilots and general-aviation pilots in Poland
**Status:** Phase 0 · **Owner:** Dominik Czekański · **Last updated:** 2026-08-28

---

## 1. Why this exists

A student pilot preparing a navigation flight in Poland today works across at least four
disconnected things: a paper or PDF VFR chart, a manual E6B, the AIP or an app for aerodrome data,
and a separate weather source. Every value is copied by hand between them, and every copy is a
chance to transpose a digit. Then the operational flight plan is filled in by hand, the ICAO flight
plan is filled in again by hand, and the flight is written into a paper logbook a third time.

Flyte collapses that into one tool: plan the route on a map, and the OFP, the FPL and the logbook
entry all derive from the same route object, with the same weather, using calculations that have
been verified against hand-computed values.

**It is a planning aid, not an approved data source.** It does not replace AIP, NOTAM or an official
briefing. That boundary is enforced in the product, not just stated — see [`SAFETY.md`](SAFETY.md).

## 2. Who it is for

**Primary — the student pilot (PPL(A) training).** Flies from EPRJ with OKL PRz. Needs OFPs that
match the training organisation's template, needs to *show working* rather than just get answers,
and is still learning the relationship between the numbers. Uses a laptop at home to plan and a
phone at the airfield to re-check.

**Secondary — the licensed GA pilot.** Wants a route planned in two minutes, a correct FPL, and a
logbook that satisfies an EASA/ULC audit. Values speed and trust over explanation.

**Secondary — the glider pilot.** Needs an EASA-compliant logbook covering launch methods and
sailplane-specific fields. Does not need route planning: a glider goes where the weather is.

**Considered, not targeted:** instructors and flying schools. The data model does not preclude them
later; nothing is built for them now.

## 3. What success looks like

- An OFP for EPRJ→EPML→EPRJ takes **under five minutes**, against roughly forty by hand.
- Every figure on that OFP matches a manual E6B computation within the tolerance in
  [`TESTING.md`](TESTING.md).
- The FPL message is accepted by IWB **first time**, with no field corrections.
- The logbook printout is accepted as a licence record.
- The owner stops using paper for flight preparation. That is the real test.

---

## 4. Scope

### In scope for v1

| Module | Summary |
|---|---|
| **Map & route planning** | Poland. Airspaces, aerodromes, navaids, VFR reporting points, obstacles. Click to find nearby features, assign ADEP/ADES/waypoint. Terrain shading and elevation profile |
| **OFP generator** | Legs with courses, times, safe altitudes; fuel plan; weight & balance with envelope; POH performance; weather; crew. Four print templates |
| **FPL generator** | ICAO Doc 4444 Items 7–19, validated, live message preview, copy and print, filing instructions |
| **Logbook** | AMC1 FCL.050 compliant. Aeroplanes, sailplanes, FSTD. Table and paper-style views, automatic totals, recency, print |
| **E6B** | Graphical rotating-dial simulator plus form mode, with a "show the working" panel |
| **Time marks (minutówki)** | Fixed-interval marks along a leg, and marks snapped to ground features |
| **Settings** | Account, PL/EN, theme, per-quantity units, fuel policy, aircraft library |
| **PWA & offline** | Calculators, logbook, OFP editing, aeronautical database, last-fetched weather |

### Explicitly out of scope for v1

Offline map tiles · IFR procedures and approach plates · commercial operations and CAT · flight
tracking or live position · route sharing between users · a native mobile app · glider route
planning · automatic FPL filing (technically impossible: PANSA IWB has no public API and
registration requires telephone confirmation) · NOTAM display (conditional on FLY-002).

---

## 5. Requirements by module

Each requirement is written so it can be verified. `MUST` is v1; `SHOULD` is v1 if time allows.

### 5.1 Map and route planning

- **MUST** display Poland with airspaces, aerodromes, navaids, VFR reporting points and obstacles,
  filterable by type, with zoom-dependent labelling.
- **MUST** respond to a map click with a distance-sorted list of nearby features — aerodromes,
  navaids, VFR points, landing sites, towns — each with a *Set as ADEP / Set as ADES / Add waypoint*
  action.
- **MUST** support building a route by clicking, dragging points, inserting a point into an existing
  leg, reordering, and undo/redo.
- **MUST** search by ICAO code, name, and coordinates in both DMS and decimal.
- **MUST** show terrain shading and, for a selected route, an elevation profile with the flight
  profile and obstacles overlaid.
- **MUST** hold 60 fps while panning on a four-year-old Android phone.
- **MUST** handle EPRJ correctly — an aerodrome inside the EPRZ control zone.
- **SHOULD** display the great-circle track with distance and course labels per leg.

### 5.2 OFP generator

- **MUST** derive from the map route, and **MUST** also be usable standalone by typing waypoints.
- **MUST** compute per leg: true and magnetic course, magnetic heading, distance, TAS, wind, WCA,
  ground speed, ETE, ETO, fuel burned, fuel remaining, safe altitude, planned altitude, frequencies.
- **MUST** compute a fuel plan: taxi, trip, contingency, alternate, final reserve, extra, block, and
  endurance — using the user's fuel policy and stating which policy was applied.
- **MUST** compute weight and balance with a plotted envelope, take-off and landing states, and an
  explicit pass/fail.
- **MUST** interpolate POH performance for TODR, LDR and rate of climb.
- **MUST** show weather for ADEP, ADES and alternates with observation times and freshness state.
- **MUST** show sunrise and sunset, and the latest VFR-day landing time.
- **MUST** produce print-ready PDFs from four templates: GA, OKL PRz training, compact, sailplane.
- **MUST** store each generated OFP as an immutable snapshot that reproduces digit-for-digit later.
- **MUST** display time marks on the map in both modes, and list them in the OFP.

### 5.3 FPL generator

- **MUST** provide every ICAO Item 7–19 field with per-field validation.
- **MUST** pre-fill from the route and the aircraft profile.
- **MUST** show a live message preview with errors highlighted in place.
- **MUST** offer copy-to-clipboard and a printable form.
- **MUST** include step-by-step instructions for filing via IWB or by telephone.
- **MUST NOT** attempt automated submission.
- **SHOULD** save reusable FPL templates for repeated flights.

### 5.4 Logbook

- **MUST** implement every AMC1 FCL.050 column.
- **MUST** support aeroplanes, sailplanes (launch method, launch count, task, maximum altitude) and
  FSTD sessions.
- **MUST** provide a table view with sorting, filtering, pagination and column selection.
- **MUST** provide a paper-style view with *this page / brought forward / total* running totals.
- **MUST** compute totals by class, by type, by function and by period, from stored seconds.
- **MUST** show FCL.060 recency status.
- **MUST** print all or selected entries.
- **MUST** work fully offline and sync when the network returns.
- **SHOULD** import CSV from other logbook applications.

### 5.5 E6B

- **MUST** provide a graphical calculator side: two coaxial logarithmic dials, rotated by drag or
  scroll wheel, with momentum and snapping to graduations.
- **MUST** provide a graphical wind side: sliding card, grommet, wind dot.
- **MUST** provide a form mode for every operation, giving identical results.
- **MUST** provide a "show the working" panel with intermediate steps — this is the training value.
- **MUST** use the same `packages/aviation` functions as the OFP. The E6B is the visible proof that
  the engine is right.

### 5.6 Settings

- **MUST** cover account, password, linked sign-in methods, and account deletion with full data
  export (GDPR).
- **MUST** switch PL/EN.
- **MUST** allow theme, accent colour, transparency, corner radius, density and font size, including
  a red night mode.
- **MUST** allow **per-quantity** unit selection, with metric / imperial / aviation-mixed presets.
- **MUST** provide an aircraft library editor: stations, envelopes, POH tables, FPL equipment, with
  JSON import and export.
- **MUST** allow overriding the fuel policy — OKL PRz requires 45 minutes where NCO says 30.

---

## 6. Non-functional requirements

| Area | Requirement |
|---|---|
| **Correctness** | Every calculation covered by golden vectors sourced outside this codebase. A vector and the implementation disagreeing blocks release |
| **Performance** | LCP < 2.5 s on 4G; map at 60 fps on a four-year-old Android; calculation engine test suite under one second |
| **Offline** | Calculators, logbook, OFP editing, aeronautical database and last weather all function with no network. Mutations queue and sync |
| **PWA** | Installable on Android, iOS and desktop. Lighthouse PWA ≥ 95 |
| **Mobile** | Usable one-handed at 375 px. Touch targets ≥ 44 px. Legible in direct sunlight |
| **Accessibility** | WCAG 2.1 AA. Full keyboard operation. Screen-reader labels on every control |
| **Internationalisation** | Complete PL and EN. No hardcoded strings |
| **Privacy** | Data belongs to the user: full export, complete deletion. No analytics without consent. No third party receives flight data |
| **Security** | Argon2id password hashing; passkeys preferred; no API key ever reaches the browser; all external calls proxied server-side |
| **Maintainability** | Two AI agents can work in parallel without conflict ([`LANES.md`](LANES.md)) |

---

## 7. Key product decisions

**Sailplanes are logbook-only.** A glider's route is decided by the weather en route, not by a plan
filed beforehand. Offering route planning would imply a capability that does not exist.

**No automated FPL filing.** PANSA IWB has no public API and registration requires telephone
confirmation by ARO. Scripting the web interface would breach their terms and break on any redesign.
Flyte generates a correct message, validates it, and tells the pilot exactly how to file it.

**No attribution on printouts.** Owner's decision, made with the licence terms in view: an OFP must
match the training organisation's template exactly. Recorded in [`DATA_SOURCES.md`](DATA_SOURCES.md) §10.

**Weather is proxied, aeronautical data is imported.** Aeronautical data changes on a 28-day cycle,
so it is imported into our own database — fast spatial queries, offline snapshots, no dependency on
OpenAIP being up. Weather changes by the minute and is fetched live with short-lived caching.

**Correctness before features.** The order is deliberate: foundation, then logbook (self-contained
and immediately useful), then the calculation engine with the E6B as its visible proof, then the
map, then the OFP.

---

## 8. Delivery

Two parallel agent lanes; estimates are sessions **per lane**. Full detail in the implementation
plan.

| Phase | Delivers | Sessions |
|---|---|---|
| 0 | Documentation, repository, CI skeleton | 3 |
| 1 | Foundation: monorepo, auth, database, i18n, theming, PWA, deployment | 5 |
| 2+3 | Logbook ‖ calculation engine + E6B | 8 |
| 4+5 | AIRAC import ‖ map, terrain and safe altitude | 9 |
| 6 | OFP, weather, time marks, print templates | 9 |
| 7 | FPL | 4 |
| 8 | Settings, aircraft library, accessibility and performance audit | 5 |

**Blocking before anything else:** FLY-002, verifying FAA NOTAM coverage for `EP**`.

## 9. Risks

| Risk | Mitigation |
|---|---|
| FAA NOTAM does not cover Poland | FLY-002 first. Fallback: link out to IWB plus manual paste |
| No real POH data available | Seed with placeholders flagged `data_verified: false` and marked in the UI everywhere |
| 90 m elevation data too coarse in the Beskids | `ElevationSource` port allows GLO-30 substitution without touching the engine |
| Map and OFP drift out of agreement | One `Route` object is the single source of truth; E2E test 2 asserts consistency |
| An agent invents a formula | `DOMAIN.md` is the only permitted source; Aviation validator role; golden vector required to merge |
| Scope creep | Explicit out-of-scope in §4 and in every task file |

## 10. Open questions

Tracked in [`DECISIONS_PENDING.md`](DECISIONS_PENDING.md). The blocking one is **D-001**: real POH
data for the six aircraft types. Without it, weight-and-balance and performance ship on placeholder
figures and must be visibly marked as unverified.
