# SAFETY.md

Flyte produces numbers that pilots use to decide whether and how to fly. The requirements in this
document are **functional requirements with tests attached**, not disclaimers bolted on at the end.

The governing principle: **a visible gap is safe; a plausible wrong number is not.** Whenever the
choice is between showing uncertainty and showing a confident-looking guess, show the uncertainty.

---

## 1. What Flyte is not

Flyte is not an approved source of aeronautical information. It does not replace AIP Poland,
NOTAM, or an official pre-flight briefing. It is a planning aid.

This must be stated where the user will actually read it – not buried in a settings page.

### 1.1 First-run acknowledgement

Before any planning feature (map, OFP, FPL) becomes usable, the user must accept:

> **PL** – „Flyte nie jest zatwierdzonym źródłem danych lotniczych. Nie zastępuje AIP, NOTAM ani
> oficjalnej odprawy przedlotowej. Odpowiedzialność za przygotowanie i wykonanie lotu ponosi
> dowódca statku powietrznego."

> **EN** – "Flyte is not an approved source of aeronautical data. It does not replace AIP, NOTAM or
> an official pre-flight briefing. Responsibility for the preparation and conduct of the flight
> rests with the pilot in command."

Stored per user with a timestamp and the text version accepted. Re-shown when the wording changes.

The logbook and E6B are exempt – a logbook is a record, and an E6B is a calculator. Neither
produces flight-planning output.

### 1.2 On printed output

The safety statement appears on OFP and FPL printouts **only where the template provides for it**.
Training-organisation templates must be reproduced exactly, and an unexpected block of text makes a
printout unusable.

This is separate from licence attribution, which never appears on printouts at all – see
[`DATA_SOURCES.md`](DATA_SOURCES.md) §10.

---

## 2. Data freshness

Stale weather presented as current is the most dangerous thing this application could do. Every
piece of time-sensitive data renders through `<DataFreshness/>`, which shows the age of the data and
changes state at defined thresholds.

| Data | Fresh | Warning (amber) | Stale (red) |
|---|---|---|---|
| METAR | < 30 min | 30–60 min | > 60 min |
| TAF | < 3 h | 3–6 h | > 6 h |
| SIGMET / AIRMET | < 30 min | 30–60 min | > 60 min |
| Winds aloft | < 3 h | 3–6 h | > 6 h |
| NOTAM | < 1 h | 1–6 h | > 6 h |
| Anything served from the offline cache | – | – | **always red** |

Rules:
- The **observation time**, not the fetch time, drives the age. A freshly fetched two-hour-old METAR
  is two hours old.
- Offline data is always marked stale, regardless of age, with an explicit "no network – last known
  value" label.
- Stale data is never silently hidden. It is shown, marked, and the pilot decides.
- A generated OFP records the age of every weather item **at generation time**, so a printout
  carries its own provenance.

## 3. AIRAC currency

Aeronautical data has a 28-day cycle. When the imported cycle has expired, a persistent banner
appears on every planning view stating the cycle number and its expiry date. It cannot be dismissed
permanently, only collapsed for the session.

The current cycle is shown on `/credits` and recorded in every OFP snapshot.

## 4. Calculations

### 4.1 Conservative rounding

| Quantity | Direction | Reason |
|---|---|---|
| Safe altitude | **up**, to the next 100 ft | Down is into terrain |
| Fuel required | **up** | Short is not recoverable in flight |
| Leg time | **up**, to the next minute | Underestimating arrival compresses reserves |
| Runway distance required | **up** | |
| Endurance | **down** | Optimistic endurance is a trap |

### 4.2 Assumptions must be visible

A number without its assumptions is not information. Alongside each result the UI shows what went
into it:

- Safe altitude → the margin applied (1000 ft / 2000 ft) and the corridor half-width.
- Fuel → the reserve policy in force, and that it is a user override where applicable.
- TAS → whether a POH IAS→CAS correction was applied or CAS was assumed equal to IAS.
- Performance figures → the POH table and interpolation basis used.

### 4.3 No silent fallbacks

If an input is missing, the calculation does not substitute a plausible default and continue. It
returns an explicit "insufficient data" state naming what is missing, and the UI shows that.

This applies especially to aircraft data. An aircraft with no POH figures loaded must produce
"performance data not entered", never a generic light-single estimate.

### 4.4 Placeholder data must be labelled

Aircraft seeded with example rather than real POH figures carry a `data_verified: false` flag.
Every view that uses them – and every printout – shows an unmissable "unverified aircraft data"
marker. The flag clears only when the owner confirms the figures against the actual POH.

### 4.5 No solution is a valid answer

Some inputs have no physical solution – wind stronger than TAS across the track, a load outside
every envelope, a runway shorter than the computed TODR. These return an explicit failure state
with the reason. Never `NaN`, never a clamped value, never a nearest-valid guess.

## 5. Units

- Every displayed quantity carries its unit. `120` is a defect; `120 kt` is a value.
- Unit preferences are per-quantity and per-user. Changing them never changes a stored value.
- A stored OFP records the units it was generated in, so reopening it a year later is unambiguous.

## 6. Provenance

Each aeronautical data point exposes where it came from – OpenAIP, an `aip_overrides` correction
from eAIP, or manual user entry – with the AIRAC cycle and, for overrides, the source reference and
date.

## 7. OFP snapshots are immutable

A generated OFP is a frozen record: route, aircraft configuration, weather with observation times,
AIRAC cycle, calculation engine version, unit preferences, fuel policy.

Editing the route afterwards produces a **new** OFP. It never mutates one that may already be
printed and in a cockpit. A printed OFP must be reproducible, to the digit, a year later.

## 8. Sailplanes

Sailplanes are recorded in the logbook only. They do not appear in route planning, OFP or FPL
selectors – a glider's route is decided by the weather, not by a flight plan, and offering the
feature would imply a capability Flyte does not have.

Enforced in code by `aircraft.class === 'SAILPLANE'`, and covered by an E2E test.

## 9. Testing obligations

Each requirement above has a test:

| Requirement | Test |
|---|---|
| First-run acknowledgement gates planning | E2E |
| Freshness thresholds and colours | Component tests at each boundary |
| Offline data always marked stale | E2E, offline context |
| Expired AIRAC banner | Component test with a stubbed clock |
| Conservative rounding | Golden vectors including exact-boundary cases |
| No `NaN` escapes the calculation engine | Property-based (fast-check) across full input ranges |
| Unverified aircraft data marked | Component + visual regression |
| No attribution on printouts | Visual regression on every print template |
| Sailplanes absent from planning selectors | E2E |
| OFP snapshot immutability | Integration test: edit route, assert prior OFP byte-identical |

## 10. Reporting a safety defect

A defect in a calculation, a freshness indicator, or a safety gate is **not** an ordinary bug.

1. Open an issue with the `safety` label immediately, before attempting a fix.
2. If the defect is on `main`, say so in the issue title – it may be in a printout someone is
   flying with.
3. Add a golden vector reproducing it **before** changing any implementation code.
4. Never adjust a golden vector to make a test pass. If vector and implementation disagree, a human
   determines which is wrong.
