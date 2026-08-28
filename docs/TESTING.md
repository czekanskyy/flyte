# TESTING.md

Flyte's testing strategy is shaped by one fact: a wrong number here can reach a cockpit. The
weight of testing therefore sits at the **bottom** of the pyramid, on pure calculations that can be
verified exhaustively against hand-computed values.

---

## The gate

```bash
pnpm verify      # typecheck → lint → test → build → e2e
```

Must pass locally before a PR is opened, and in CI before a merge. No exceptions, no "it's just a
doc change" – the gate is cheap precisely so it can be unconditional.

---

## 1. Golden vectors – the core of the strategy

Every public function in `packages/aviation` has hand-verified test vectors in
`packages/aviation/test/vectors/<module>.json`.

```json
{
  "id": "wind-triangle-001",
  "source": "Derived from DOMAIN.md §6.2; cross-check on manual E6B",
  "given":  { "tc_deg": 90, "tas_kt": 100, "wind_dir_deg": 40, "wind_kt": 20 },
  "expect": { "wca_deg": -8.81, "th_deg": 81.19, "gs_kt": 85.96 },
  "tolerance": 0.05
}
```

**`source` is mandatory** and must name something outside this codebase: a manual E6B or CX-3
computation, a POH worked example, NOAA's published WMM test values, an AIP figure, or an explicit
derivation in `DOMAIN.md`.

**Never** generate expected values by running the implementation. That tests that the code does
what it does.

### The rule that matters most

> **If a golden vector and the implementation disagree, do not touch the vector.**

One of them is wrong and a human must decide which. Adjusting the vector to green the build is the
single most dangerous thing anyone can do in this repository. If you believe a vector is wrong, say
so in the PR and leave it failing.

### Required coverage

| Module | Minimum vectors |
|---|---|
| `geo` | Known distance/bearing pairs; a Poland-length leg; a very short leg; antipodal edge case |
| `magnetic` | NOAA's official WMM2025 test values, verbatim |
| `atmosphere` | ISA sea level; 5000 ft; non-standard QNH; hot and cold ISA deviations |
| `navigation` | Wind triangle across all four quadrants; zero wind; pure head/tailwind; no-solution case |
| `mass-balance` | A full worked POH example per aircraft type; a point exactly on the envelope boundary |
| `performance` | Table interpolation at grid points, between them, and at table edges |
| `fuel` | NCO day and night; a user override; the OKL PRz 45-minute case |
| `terrain` | A synthetic DEM with a known peak; the 2000 ft high-terrain margin trigger |
| `icao` | Real FPL messages, encoded and decoded round-trip |
| `units` | Every conversion, both directions, plus round-trip identity |

```bash
pnpm test:vectors
```

## 2. Property-based tests (fast-check)

Vectors verify specific points; properties verify the whole input space. Use them wherever a
mathematical invariant exists.

```ts
// Round-tripping any conversion must return the original value.
fc.assert(fc.property(fc.double({ min: -1000, max: 60000 }), (ft) =>
  expect(feetToMetres(metresToFeet(metres(ft)))).toBeCloseTo(ft, 9)
));
```

Invariants that must be covered:

- Every unit conversion round-trips.
- `WS = 0` ⟹ `GS = TAS` and `WCA = 0`.
- Leg times sum to the route total (computed from seconds, not from rounded minutes).
- Safe altitude is monotonic: raising any terrain sample never lowers the result.
- CG is bounded by the extreme station arms.
- **Nothing in `packages/aviation` ever returns `NaN` or `Infinity`** for any finite input. This one
  property has more defect-finding power than any other test in the repo – run it over every
  exported function.

## 3. Unit tests

Vitest, colocated as `*.test.ts`. For parsers, validators, formatters, date handling, and business
logic outside the calculation engine.

METAR/TAF parsing deserves particular attention: feed it real messages from EPRJ, EPML, EPKR, EPWA
including the malformed and unusual ones. A parser that throws on a real-world METAR fails at
exactly the wrong moment.

## 4. Component tests

Testing Library, on behaviour rather than implementation. Query by role and accessible name.

Mandatory coverage:
- `<DataFreshness/>` at **each** threshold boundary – 29/30/31 min, 59/60/61 min.
- Forms: validation messages, error states, keyboard navigation.
- Unit-aware displays: switching preference re-renders without altering the stored value.
- Empty, loading and error states. Every one of them, every time.

## 5. E2E tests (Playwright)

Seven journeys. They run in CI on every PR.

1. **Account and logbook** – register → sign in (password, then passkey) → add an AT-3 → add a
   logbook entry → print to PDF.
2. **Route to OFP** – click the map near **EPRJ** → set ADEP → set **EPML** as ADES → add a
   turning point → generate OFP → **assert the sum of leg times equals the route total**.
3. **Terrain** – **EPRJ→EPKR** → safe altitude is non-zero and rises toward the Beskids → the
   terrain profile renders.
4. **FPL** – build from the route → validate → the message matches a fixture, and **EPRJ inside the
   EPRZ zone is handled correctly**.
5. **E6B** – rotate the dial by a set amount → the reading matches a golden vector.
6. **Offline** – go offline → add a logbook entry → come back online → it syncs.
7. **Sailplane scope** – a Puchacz does **not** appear in map/OFP/FPL selectors and **does** appear
   in the logbook.

Rules: no `waitForTimeout`; wait on state. No shared state between tests. Every test creates and
cleans up its own data.

## 6. Visual regression on print templates

Every print template renders with a fixed dataset and is compared against a committed screenshot.
Print output is the product here – a template that silently shifts by 3 mm no longer matches the
training organisation's form.

Assertions each template must satisfy:
- Page count and page breaks are stable.
- Field positions are stable.
- **No licence or attribution text appears anywhere on the page** ([`DATA_SOURCES.md`](DATA_SOURCES.md) §10.1).
- Unverified aircraft data is visibly marked ([`SAFETY.md`](SAFETY.md) §4.4).

## 7. Safety requirement tests

Every requirement in [`SAFETY.md`](SAFETY.md) has a test; the mapping table is in that document's
§9. A PR that touches a safety mechanism without touching its test will be sent back.

## 8. Pilot validation

Automated tests prove the code does what we specified. They cannot prove we specified the right
thing. At the end of each phase the owner works through
[`PILOT_VALIDATION.md`](PILOT_VALIDATION.md): comparing Flyte's output against a manual E6B, against
POH charts, against a VFR chart, and against the FPL they would actually file.

This is the only check that catches a formula that is correctly implemented and wrong.

---

## What we do not do

- **No coverage percentage target.** Coverage measures lines executed, not behaviour verified. One
  hand-computed vector is worth more than a hundred lines of incidental coverage.
- **No snapshot tests of component markup.** They break on every refactor and catch nothing.
- **No mocking inside `packages/aviation`.** It is pure by construction; if a test there needs a
  mock, the code is in the wrong package.
- **No network in tests.** External APIs are mocked with MSW using recorded real responses in
  `test/fixtures/`.

## Commands

```bash
pnpm test                          # unit + vectors, watch mode locally
pnpm test:vectors                  # golden vectors only
pnpm test:run                      # single pass, as CI runs it
pnpm test:e2e                      # Playwright
pnpm test:e2e --ui                 # Playwright interactive
pnpm test:visual --update-snapshots  # after an INTENDED template change only
pnpm --filter @flyte/aviation test   # calculation engine alone – sub-second
```
