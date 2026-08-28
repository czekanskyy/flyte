# DOMAIN.md — aviation reference for Flyte

**This file is the only permitted source of aviation formulas, constants and rules in this project.**

If a calculation you need is not here, you may not implement it. Add it here first, with a citation,
and have it reviewed. If a formula here disagrees with your implementation, the formula wins until a
human resolves it.

Markers used below:
- ✅ **Verified** — derived from first principles or taken from a cited standard, and cross-checked.
- ⚠ **VERIFY** — believed correct but not yet checked against the primary source. Must be confirmed
  before the feature ships. Track in [`DECISIONS_PENDING.md`](DECISIONS_PENDING.md).

---

## 1. Conventions used throughout Flyte

| Convention | Value | Rationale |
|---|---|---|
| Internal units | SI: m, m/s, kg, K, Pa, s, rad | One unit system inside the engine; conversion only at the UI boundary |
| Angle storage | radians | Trig functions take radians; degrees are a display format |
| Bearing reference | degrees **true** internally, converted to magnetic for display | Magnetic declination changes with time and place; storing magnetic values would silently rot |
| Bearing range | 0° ≤ θ < 360°, clockwise from north | |
| Leg course | **geodesic (great-circle) initial azimuth**, declination taken at the **leg midpoint** | Matches how a course is measured on a Lambert conformal chart for GA-length legs |
| Earth model | WGS84 ellipsoid via `geographiclib-geodesic` | Spherical approximations (turf.js) accumulate error over a route |
| Time | UTC internally, always | Aviation runs on UTC; local time is a display concern |
| Rounding | Safe altitudes **up**; fuel **up**; times **up** to the next whole minute | Every rounding decision must be conservative for the pilot |

### Glossary PL ↔ EN

| EN | PL | Symbol |
|---|---|---|
| True course | Kurs rzeczywisty (trasa) | TC |
| True heading | Kurs rzeczywisty | TH |
| Magnetic course | Kurs magnetyczny | MC |
| Magnetic heading | Kurs magnetyczny (kompasowy) | MH |
| Magnetic declination / variation | Deklinacja magnetyczna | VAR, δ |
| Compass deviation | Dewiacja kompasu | DEV |
| Wind correction angle / drift angle | Kąt poprawki na wiatr / kąt znoszenia | WCA |
| Indicated airspeed | Prędkość przyrządowa | IAS |
| Calibrated airspeed | Prędkość poprawiona | CAS |
| True airspeed | Prędkość rzeczywista | TAS |
| Ground speed | Prędkość podróżna (względem ziemi) | GS |
| Pressure altitude | Wysokość ciśnieniowa | PA |
| Density altitude | Wysokość gęstościowa | DA |
| Estimated time enroute | Przewidywany czas przelotu | ETE |
| Estimated time of arrival | Przewidywany czas przylotu | ETA |
| Top of climb / descent | Punkt końca wznoszenia / początku zniżania | TOC / TOD |
| Safe altitude | Bezpieczna wysokość | Safe Alt |
| Maximum elevation figure | Maksymalna wysokość przeszkód w kwadracie | MEF |
| Centre of gravity | Środek ciężkości | CG / SC |
| Take-off / landing mass | Masa startowa / do lądowania | TOM / LM |
| Take-off distance required | Wymagana długość startu | TODR |
| Landing distance required | Wymagana długość lądowania | LDR |
| Rate of climb | Prędkość wznoszenia | ROC |
| Departure / destination aerodrome | Lotnisko odlotu / docelowe | ADEP / ADES |
| Alternate aerodrome | Lotnisko zapasowe | ALTN |
| Time marks along a leg | Minutówki | — |

---

## 2. Geodesy

### 2.1 Distance and initial bearing ✅

Use the WGS84 **inverse geodesic problem** (Karney's algorithm, `geographiclib-geodesic`). Given
two points it returns distance `s12` (metres) and initial/final azimuths `azi1`, `azi2` (degrees).

Do **not** use the haversine formula for navigation output. On a Warsaw–Kraków leg the spherical
error is small, but it accumulates across a multi-leg route and there is no reason to accept it
when an exact solver is a dependency away.

```
{ s12, azi1, azi2 } = Geodesic.WGS84.Inverse(lat1, lon1, lat2, lon2)
distance = s12                       // metres
true_course = normalise360(azi1)     // degrees true, at the start of the leg
```

### 2.2 Point at a distance along a leg ✅

The **direct geodesic problem** — needed for time marks (minutówki) and terrain sampling:

```
{ lat2, lon2 } = Geodesic.WGS84.Direct(lat1, lon1, azi1, s12)
```

### 2.3 Leg midpoint ✅

`Direct(lat1, lon1, azi1, s12 / 2)`. Used as the reference point for magnetic declination (§3.2).

### 2.4 Angle normalisation ✅

```
normalise360(θ) = ((θ mod 360) + 360) mod 360        // → [0, 360)
signedDelta(a, b) = ((a − b + 540) mod 360) − 180    // → (−180, 180]
```

`signedDelta` is the correct way to compute an angular difference — naive subtraction breaks across
the 0°/360° boundary. Use it everywhere.

---

## 3. Magnetic declination

### 3.1 Model ✅

**World Magnetic Model 2025 (WMM2025)**, valid 2025-01-01 to 2029-12-31, released 2024-12-17 by
NOAA NCEI / NGA / BGS. The coefficient file `WMM.COF` is public domain.

Structure: degree- and order-12 spherical harmonic main field (168 Gauss coefficients) plus a
degree- and order-12 secular variation model.

We implement this ourselves in `packages/aviation/magnetic`. No maintained npm package exists —
the available ones ship expired WMM2020 coefficients, and an expired magnetic model in an EFB is
not acceptable.

> **Maintenance:** WMM2030 must replace these coefficients before 2030-01-01.
> Tracked in [`MAINTENANCE.md`](MAINTENANCE.md).

**Golden vectors:** NOAA publishes official test values for WMM2025. Use them verbatim — do not
generate expected values from our own implementation.

Poland sits at roughly **+5° to +7° East** declination in 2026. Use this only as a smoke-test
sanity range, never as a computed value.

### 3.2 Applying declination ✅

Declination is **positive East**.

```
magnetic_course = normalise360(true_course − declination)
true_course     = normalise360(magnetic_course + declination)
```

Mnemonic cross-check: *"East is least, West is best"* — easterly variation is subtracted from true
to get magnetic. With Poland's +6°E, a true course of 090° is a magnetic course of 084°.

Declination is evaluated at the **leg midpoint** (§2.3), at the planned cruising altitude, for the
planned date.

### 3.3 Compass deviation ✅

```
compass_heading = normalise360(magnetic_heading − deviation)
```

Deviation comes from the individual aircraft's compass correction card and is stored per aircraft.
Default is zero — and a zero default must be visibly labelled as "no card entered", never silently
assumed correct.

---

## 4. Standard atmosphere (ISA)

### 4.1 Constants ✅

ICAO Standard Atmosphere, troposphere (0–11 km):

| Constant | Symbol | Value |
|---|---|---|
| Sea-level temperature | T₀ | 288.15 K (15 °C) |
| Sea-level pressure | p₀ | 101325 Pa (1013.25 hPa) |
| Sea-level density | ρ₀ | 1.225 kg/m³ |
| Temperature lapse rate | L | 0.0065 K/m (≈ 1.98 °C per 1000 ft) |
| Gravitational acceleration | g₀ | 9.80665 m/s² |
| Specific gas constant, dry air | R | 287.05287 J/(kg·K) |
| Barometric exponent | g₀/(L·R) | ≈ 5.25588 |

### 4.2 Temperature and pressure with altitude ✅

```
T(h) = T₀ − L·h                                  [K,  h in metres]
p(h) = p₀ · (1 − L·h / T₀) ^ (g₀ / (L·R))
ρ(h) = p(h) / (R · T(h))
```

### 4.3 Pressure altitude ✅

```
PA_ft = elevation_ft + 145366.45 · [ 1 − (QNH_hPa / 1013.25) ^ 0.190284 ]
```

Sanity check: QNH = 1013.25 → PA = elevation. A 10 hPa drop gives +274 ft, consistent with the
familiar **27 ft per hPa** rule of thumb near sea level. Use the exact form in code; the rule of
thumb belongs only in the E6B "show your working" panel.

### 4.4 ISA temperature and deviation ✅

```
ISA_temp_C  = 15 − 1.98 · (PA_ft / 1000)
ISA_dev_C   = OAT_C − ISA_temp_C
```

### 4.5 Density altitude ✅

```
DA_ft = PA_ft + 118.8 · ISA_dev_C
```

The 118.8 ft/°C coefficient is the standard linearisation around ISA conditions. The widely taught
"120 ft per °C" is the same figure rounded; use 118.8 in code.

### 4.6 Density ratio ✅

```
σ = ρ / ρ₀ = (1 − 6.87535e−6 · DA_ft) ^ 4.2559
```

---

## 5. Airspeeds

### 5.1 Chain ✅

```
IAS → (position/instrument error, from POH) → CAS → (density) → TAS → (wind) → GS
```

The IAS→CAS correction table is aircraft-specific and comes from the POH. When no table is
available, CAS = IAS **and the UI must say so** — do not silently equate them.

### 5.2 TAS from CAS ✅

For the speed range GA aircraft operate in (below roughly 200 kt, below FL200) the incompressible
form is accurate enough and is what the E6B implements:

```
TAS = CAS / √σ
```

Rule-of-thumb cross-check: TAS ≈ CAS + 2 % per 1000 ft of density altitude. At DA 5000 ft,
CAS 100 kt → σ = 0.8617, √σ = 0.9283, TAS = 107.7 kt; the rule of thumb gives 110 kt. The exact
form is authoritative; the discrepancy is why the rule of thumb is a cross-check, not a method.

> ⚠ **VERIFY** before any turbine or high-altitude support is added: above ~200 kt the compressible
> correction becomes significant and this formula must be replaced.

---

## 6. Wind triangle

### 6.1 Definitions ✅

- `TC` — true course, the intended track over the ground.
- `WD` — wind direction, **the direction the wind blows FROM**, degrees true.
- `WS` — wind speed.
- `TAS` — true airspeed.
- `WCA` — wind correction angle, **positive to the right** (crab right of track).

Meteorological reports (METAR, TAF, winds aloft) give the direction the wind comes *from*. This
catches people out constantly; it is the sign convention used everywhere in this codebase.

### 6.2 Solution ✅

```
Δ    = signedDelta(WD, TC)                  // wind angle relative to course
sin(WCA) = (WS / TAS) · sin(Δ)
WCA  = asin( (WS / TAS) · sin(Δ) )
TH   = normalise360(TC + WCA)
GS   = TAS · cos(WCA) − WS · cos(Δ)
```

**Headwind and crosswind components** (also used for runway calculations, with runway heading in
place of TC):

```
headwind  = WS · cos(Δ)      // positive = headwind, negative = tailwind
crosswind = WS · sin(Δ)      // positive = from the right
```

### 6.3 Worked example — golden vector `wind-triangle-001` ✅

Given TC = 090°, TAS = 100 kt, wind 040°/20 kt:

```
Δ        = signedDelta(40, 90) = −50°
sin(WCA) = (20 / 100) · sin(−50°) = 0.2 · (−0.76604) = −0.15321
WCA      = asin(−0.15321) = −8.814°
TH       = 090 − 8.814 = 081.19°
GS       = 100 · cos(−8.814°) − 20 · cos(−50°)
         = 100 · 0.98819 − 20 · 0.64279
         = 98.819 − 12.856 = 85.96 kt
```

Physical sanity check: the wind is from the left front, so the aircraft crabs **left** (negative
WCA, heading less than course) and loses ~13 kt to the headwind component. Both hold.

```json
{
  "id": "wind-triangle-001",
  "source": "Derived from DOMAIN.md §6.2; cross-check on manual E6B",
  "given":  { "tc_deg": 90, "tas_kt": 100, "wind_dir_deg": 40, "wind_kt": 20 },
  "expect": { "wca_deg": -8.81, "th_deg": 81.19, "gs_kt": 85.96 },
  "tolerance": 0.05
}
```

### 6.4 Invariants for property-based tests ✅

- `WS = 0` ⟹ `WCA = 0` and `GS = TAS`.
- Pure headwind (`Δ = 0`) ⟹ `WCA = 0` and `GS = TAS − WS`.
- Pure tailwind (`Δ = 180°`) ⟹ `WCA = 0` and `GS = TAS + WS`.
- `WS > TAS` with a large `|Δ|` has **no solution** — the aircraft cannot hold the course. The
  function must return an explicit "no solution" result, never `NaN`.
- Reversing the course and keeping the wind reverses the sign of the crosswind component.

---

## 7. Time, distance and fuel per leg

```
ETE_seconds     = distance / GS
ETO(n)          = ETD + Σ ETE(1..n)
fuel_burn(leg)  = ETE_hours · fuel_flow
```

Displayed leg times round **up** to the next whole minute. Totals are computed from unrounded
seconds and rounded once at the end — rounding each leg and then summing inflates the total.

---

## 8. Fuel planning

### 8.1 Regulatory basis

Regulation (EU) 965/2012, **Annex VII (Part-NCO), NCO.OP.125** — fuel/energy scheme for aeroplanes.

> ⚠ **VERIFY** — the numeric minima below are the values commonly taught and applied in Polish GA
> training, but the exact wording must be checked against the **current consolidated text** of
> Reg. (EU) 965/2012 Annex VII before release. Do not treat this section as a legal source.
> Tracked in [`DECISIONS_PENDING.md`](DECISIONS_PENDING.md).

| Operation | Final reserve (commonly applied) |
|---|---|
| VFR by day | 30 minutes at normal cruising power |
| VFR by night | 45 minutes at normal cruising power |
| IFR | 45 minutes at normal cruising power |

### 8.2 Block fuel structure ✅

```
taxi          — from POH or a per-aircraft default
trip          — Σ leg burns, including climb and descent allowances
contingency   — percentage of trip fuel (default 5 %), configurable
alternate     — trip fuel to the alternate, computed as a normal route
final_reserve — from the table above, per user policy
extra         — pilot's discretion

block = taxi + trip + contingency + alternate + final_reserve + extra
```

**Project default:** NCO minima, overridable per user via `user_settings.fuel_policy`. This is not
cosmetic — OKL PRz (the operator at EPRJ) requires **45 minutes** even for VFR by day. The default
must be adjustable and the active policy must be visible on the OFP.

### 8.3 Endurance ✅

```
endurance_hours = usable_fuel / fuel_flow
```

Computed on **usable** fuel, never total capacity. The difference is unusable fuel from the POH.

### 8.4 Mass ↔ volume ✅

| Fuel | Density (15 °C) |
|---|---|
| AVGAS 100LL | 0.72 kg/l |
| JET A-1 | 0.80 kg/l |
| MOGAS | ⚠ **VERIFY** — varies by specification and season; must be entered per aircraft |

Densities are temperature-dependent. For GA planning the 15 °C figures are standard practice; if
temperature compensation is ever added it must be a deliberate, documented change.

---

## 9. Mass and balance

### 9.1 Core relations ✅

```
moment_i = mass_i · arm_i
total_mass   = Σ mass_i
total_moment = Σ moment_i
CG           = total_moment / total_mass
```

Arms are measured from the aircraft datum defined in the POH. The datum differs between types —
it is a per-aircraft property, never a constant.

### 9.2 Envelope check ✅

The certified envelope is a **closed polygon** in (CG, mass) space, not a pair of min/max limits.
Testing against a bounding box will pass loading states that are actually outside the envelope.

Use a ray-casting point-in-polygon test, with points exactly on the boundary treated as **inside**
(the limit itself is certified).

Many types have more than one envelope — typically *normal* and *utility* categories with different
manoeuvre limits. All applicable envelopes are stored per aircraft and checked independently.

### 9.3 CG travel in flight ✅

Fuel burn moves the CG. Both the take-off and the landing state must be inside the envelope, and
so must the straight line between them — burning fuel moves the CG monotonically along that line,
so checking both endpoints is sufficient for a single fuel tank group.

> ⚠ **VERIFY** for aircraft with multiple tanks burned in sequence (PA-34): the CG path is
> piecewise linear, not a single segment. Each sequence point must be checked.

---

## 10. Terrain and safe altitude

### 10.1 Legal minimum — SERA.5005(f)

Regulation (EU) 923/2012 (SERA), **SERA.5005(f)** — VFR minimum heights:

> ⚠ **VERIFY** against the consolidated SERA text. Commonly applied as:
> - Over congested areas of cities, towns or settlements, or over open-air assemblies:
>   **300 m (1000 ft)** above the highest obstacle within **600 m** of the aircraft.
> - Elsewhere: **150 m (500 ft)** above ground or water.

This is the *legal minimum*, not a planning altitude.

### 10.2 Planning safe altitude — project convention ✅

Flyte computes a **planning** safe altitude, deliberately more conservative than the legal minimum:

```
corridor      = ±5 NM either side of the leg centreline
MEF           = max( terrain elevation, obstacle tops ) within the corridor
margin        = 1000 ft, or 2000 ft where terrain within the corridor exceeds 3000 ft AMSL
Safe Alt      = ceil_to_100ft( MEF + margin )
```

The applied margin **must always be displayed** alongside the figure. A safe altitude without its
assumptions is not information.

The corridor half-width and margins are configurable; the defaults above are what appears on the
OFP unless the user changes them.

### 10.3 Terrain sampling ✅

Sample at intervals of at most **1 NM** along the leg, and across the corridor width, using the
`ElevationSource` port. Sparse sampling can step straight over a ridge — an under-sampled safe
altitude is worse than none, because it looks authoritative.

Current source: Copernicus GLO-90 (90 m resolution) via Open-Meteo. This resolution is adequate for
lowland routes such as EPRJ→EPML but **marginal in the Beskids** on EPRJ→EPKR. The port exists so
GLO-30 can be substituted without touching the calculation.

---

## 11. Logbook

### 11.1 Basis

**AMC1 FCL.050** to Regulation (EU) 1178/2011 Annex I (Part-FCL) defines the pilot logbook format.

Polish national law does not define a separate format: it refers directly to AMC1 FCL.050. One data
model therefore satisfies both EASA and ULC requirements.

### 11.2 Required columns ✅

| # | Group | Fields |
|---|---|---|
| 1 | Date | dd/mm/yy |
| 2 | Departure | Place, Time (UTC) |
| 3 | Arrival | Place, Time (UTC) |
| 4 | Aircraft | Make, Model, Variant; Registration |
| 5 | Single-pilot time | Single-engine, Multi-engine |
| 6 | Multi-pilot time | |
| 7 | Total time of flight | |
| 8 | Name(s) of PIC | "SELF" when the holder is PIC |
| 9 | Landings | Day, Night |
| 10 | Operational condition time | Night, IFR |
| 11 | Pilot function time | PIC, Co-pilot, Dual, Instructor |
| 12 | FSTD session | Date, Type, Total time of session |
| 13 | Remarks and endorsements | |

### 11.3 Sailplanes ✅

AMC1 FCL.050 states that for sailplanes and balloons a suitable format containing the relevant
items plus information specific to the operation should be used. **SFCL.050** governs sailplane
pilot licences.

Flyte records, in addition to the columns above:

- **Launch method** — aerotow, winch, self-launch, bungee
- **Number of launches**
- **Task / distance** for cross-country flights
- **Maximum altitude reached**

> ⚠ **VERIFY** the exact SFCL.050 wording and whether any further field is mandatory.

### 11.4 Recency — FCL.060(b)(1) ✅

> ⚠ **VERIFY** wording. Commonly applied: to carry passengers as PIC, a pilot must have completed
> **3 take-offs, approaches and landings** in the preceding **90 days** in an aircraft of the same
> type or class (or an FFS qualified for the purpose).

For tailwheel aircraft and for night flight, additional conditions apply.

### 11.5 Totals ✅

The paper-style view reproduces the running-total structure of a physical logbook:

```
this page  +  brought forward from previous pages  =  total time
```

Totals are computed from stored **seconds** and formatted for display. Never store, and never sum,
pre-rounded hours-and-minutes values — the error compounds across hundreds of entries.

---

## 12. ICAO flight plan (FPL)

Field-by-field encoding rules for Items 7–19 live in
[`FPL_FIELDS.md`](FPL_FIELDS.md) (written in Phase 7), sourced from **ICAO Doc 4444, Appendix 2**.

Two rules that belong here because they affect the whole route model:

- **Item 15 speed and level formats** — speed as `N` + 4 digits in knots (`N0100`), level as `A` +
  3 digits in hundreds of feet for VFR altitudes (`A045`), or the literal `VFR`.
- **Item 15 route** — `DCT` between points with no published route; waypoints as ICAO identifiers,
  named points, or degrees/minutes coordinates.

---

## 13. Sunrise, sunset and VFR day

Civil twilight and sunrise/sunset times are computed with `suncalc` for the aerodrome position and
date.

> ⚠ **VERIFY** the definition of "night" applicable in Polish airspace (SERA definition: the period
> between the end of evening civil twilight and the beginning of morning civil twilight) and the
> exact buffer applied by ULC/PANSA to VFR day operations. This determines the hard latest-landing
> time shown on the OFP, so it must be sourced, not assumed.

---

## 14. Sources

| Source | Used for |
|---|---|
| ICAO Doc 4444 — PANS-ATM, Appendix 2 | FPL fields 7–19 |
| ICAO Doc 8643 — Aircraft Type Designators | `icao_type_designator` per aircraft |
| ICAO Doc 7488 — Manual of the ICAO Standard Atmosphere | §4 constants and relations |
| Reg. (EU) 1178/2011 Annex I (Part-FCL), AMC1 FCL.050 | §11 logbook |
| Reg. (EU) 965/2012 Annex VII (Part-NCO), NCO.OP.125 | §8 fuel |
| Reg. (EU) 923/2012 (SERA), SERA.5005 | §10.1 VFR minimum heights |
| NOAA NCEI — World Magnetic Model 2025 | §3 declination, and its golden vectors |
| AIP Poland / eAIP VFR (PANSA) | Aerodrome and airspace data verification |
| Aircraft POH / AFM | §5.1 IAS→CAS, §9 arms and envelopes, §8 fuel flows, performance tables |
