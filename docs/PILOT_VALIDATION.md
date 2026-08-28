# PILOT_VALIDATION.md

Automated tests prove the code does what the specification says. They cannot prove the specification
is right. This checklist is the only thing that catches a formula that is implemented perfectly and
is wrong.

**Performed by the owner, as a pilot, at the end of each phase.** It cannot be delegated to an
agent – the whole point is comparison against an independent, human, non-software source.

---

## How to use this

For each item: compute it independently first – manual E6B or CX-3, POH chart, VFR chart, paper
logbook – **then** compare with Flyte. Not the other way round. Reading Flyte's answer first will
anchor your manual working to it; this is a well-documented effect and it is exactly what this
exercise is trying to defeat.

Record every discrepancy, however small. A 2-knot ground speed difference is either a rounding
convention worth documenting or a formula defect worth finding, and you cannot tell which by
looking at it.

**Any unexplained discrepancy in a safety-relevant figure blocks the phase.**

---

## Phase 2+3 – calculation engine and E6B

### E6B against your physical calculator

| Check | Manual | Flyte | Δ | OK |
|---|---|---|---|---|
| TAS from CAS 100 kt, PA 5000 ft, OAT +5 °C | | | | ☐ |
| Ground speed and WCA: TC 090, TAS 100, wind 040/20 | | | | ☐ |
| Ground speed and WCA: TC 270, TAS 90, wind 180/15 | | | | ☐ |
| Time for 47 NM at 96 kt GS | | | | ☐ |
| Fuel for 1 h 23 min at 28 l/h | | | | ☐ |
| Density altitude: PA 2000 ft, OAT +30 °C | | | | ☐ |
| Crosswind on RWY 09, wind 130/18 | | | | ☐ |
| Pressure altitude at EPRJ, QNH 1003 | | | | ☐ |

The graphical dial and the form mode must agree exactly – they call the same functions. If they do
not, that is a defect regardless of which one matches your E6B.

### Magnetic declination

| Check | Reference | Flyte | OK |
|---|---|---|---|
| Declination at EPRJ today | NOAA online calculator | | ☐ |
| Declination at EPWA today | NOAA online calculator | | ☐ |
| Declination requested for 2031 | must return an **error**, not a number | | ☐ |

### Weight and balance – against the actual POH

Per type (AT-3, TB-9, PA-28, PA-34):

| Check | POH | Flyte | OK |
|---|---|---|---|
| Empty mass and CG match the weighing report | | | ☐ |
| A worked example from the POH reproduces exactly | | | ☐ |
| A deliberately out-of-envelope load is **rejected** | | | ☐ |
| A load exactly on the envelope boundary is **accepted** | | | ☐ |
| Landing CG after fuel burn is correct | | | ☐ |
| Utility category checked separately from normal | | | ☐ |
| PA-34: sequenced tank burn handled correctly | | | ☐ |

If the aircraft still carries `data_verified: false`, confirm the unverified marker is visible in
**every** place the figures appear, including the printout.

---

## Phase 4+5 – map, terrain, safe altitude

| Check | Reference | Flyte | OK |
|---|---|---|---|
| EPRJ position and elevation | AIP VFR | | ☐ |
| **EPRJ shown correctly inside the EPRZ zone** | VFR chart | | ☐ |
| Airspace boundaries near EPRZ | VFR chart | | ☐ |
| EPML and EPKR positions and elevations | AIP VFR | | ☐ |
| VFR reporting points around EPRZ | AIP VFR | | ☐ |
| Distance EPRJ→EPML | measured on chart | | ☐ |
| Magnetic course EPRJ→EPML | measured on chart | | ☐ |
| Safe altitude EPRJ→EPML | MEF on chart + 1000 ft | | ☐ |
| **Safe altitude EPRJ→EPKR** | MEF on chart + margin | | ☐ |
| Terrain profile EPRJ→EPKR looks like the real terrain | your knowledge of the route | | ☐ |
| Obstacles near the route present and correct | AIP ENR 5.4 | | ☐ |

EPRJ→EPKR is the critical one. It runs toward the Beskids and it is where 90 m elevation data is
expected to be marginal. If safe altitude reads low against the chart MEF, say so – that is the
trigger for switching to GLO-30, and it is a finding this checklist exists to produce.

Also confirm: the applied margin (1000 or 2000 ft) is displayed next to every safe altitude.

---

## Phase 6 – OFP

Prepare a full OFP for **EPRJ→EPML→EPRJ** with a real aircraft and today's real weather. Then
prepare the same flight entirely by hand.

| Section | Manual | Flyte | Δ | OK |
|---|---|---|---|---|
| Leg 1 magnetic course | | | | ☐ |
| Leg 1 ground speed | | | | ☐ |
| Leg 1 time | | | | ☐ |
| Leg 1 fuel | | | | ☐ |
| Total distance | | | | ☐ |
| Total time | | | | ☐ |
| Trip fuel | | | | ☐ |
| Block fuel | | | | ☐ |
| Endurance | | | | ☐ |
| Safe altitudes per leg | | | | ☐ |
| Sunset, and latest VFR-day landing time | | | | ☐ |

Then:

- [ ] METAR and TAF match what you get from an independent source right now
- [ ] Data freshness indicators show sensible ages
- [ ] Winds aloft are plausible for today
- [ ] **Fuel policy shown on the OFP is the OKL PRz 45-minute one**, not the NCO default
- [ ] Sum of leg times equals the stated total (not off by rounding)
- [ ] Time marks fall where you would actually expect them on the ground – the river, the motorway,
      the town. Fly the route mentally and check they make sense as visual checkpoints
- [ ] **The printout matches the OKL PRz template.** Layout, field positions, page breaks
- [ ] **No licence or attribution text anywhere on the printout**
- [ ] Reopening a saved OFP a day later reproduces identical figures

---

## Phase 7 – FPL

Build an FPL for a flight you would genuinely file, then compare against the message you would
compose yourself.

| Item | Yours | Flyte | OK |
|---|---|---|---|
| 7 – Aircraft identification | | | ☐ |
| 8 – Flight rules and type | | | ☐ |
| 9 – Number, type, wake turbulence category | | | ☐ |
| 10 – Equipment and capabilities | | | ☐ |
| 13 – Departure and time | | | ☐ |
| 15 – Speed, level, route | | | ☐ |
| 16 – Destination, EET, alternates | | | ☐ |
| 18 – Other information | | | ☐ |
| 19 – Supplementary information | | | ☐ |

- [ ] Validation rejects a deliberately malformed field with a message that says what is wrong
- [ ] The filing instructions are accurate against the current IWB interface
- [ ] Printed form is usable at ARO

**The real test:** file it through IWB and see whether it is accepted without correction.

---

## Phase 2 / 8 – logbook

- [ ] A month of entries from your paper logbook, entered into Flyte, produce identical totals
- [ ] SE, ME, night, IFR, PIC, dual and instructor breakdowns all match
- [ ] Paper-style view reproduces your logbook's layout closely enough to be recognisable
- [ ] Running totals – this page / brought forward / total – are correct across a page boundary
- [ ] FCL.060 recency status matches your own count
- [ ] Sailplane entries carry launch method and launch count; totals separate from aeroplanes
- [ ] A printout would be accepted as a licence record
- [ ] An entry crossing UTC midnight is handled correctly
- [ ] A flight ending the following day is handled correctly

---

## Recording findings

For each discrepancy:

```markdown
### PV-YYYY-NN · <what>
**Phase:** N · **Found:** YYYY-MM-DD
**Manual result:** …
**Flyte result:** …
**Difference:** …
**Assessment:** rounding convention / formula defect / data defect / manual error
**Action:** issue #NN, or documented as intended behaviour
```

File defects with the `safety` label. Per [`SAFETY.md`](SAFETY.md) §10: add a reproducing golden
vector **before** anyone changes implementation code.
