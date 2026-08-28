# DECISIONS_PENDING.md

Open questions that need a human answer. **Agents append here rather than guessing** – see
[`AGENTS.md`](../AGENTS.md) rule 2.

Format: one entry per question, newest at the top of its section. When answered, move the entry to
"Resolved" with the answer and the date, and remove the corresponding `TODO(FLY-XXX)` from the code.

---

## Blocking – work cannot proceed correctly without an answer

### D-001 · Real POH data for the owner's aircraft
**Needed for:** Phase 2+3 (mass & balance, performance), Phase 6 (OFP fuel and performance blocks)
**Asked:** 2026-08-28

Weight-and-balance and performance cannot be correct without real figures. For each type we need:

- Empty mass and empty-mass CG arm (from the actual aircraft's current weighing report)
- Datum position and station arms – front seats, rear seats, baggage compartments, fuel tanks
- Envelope polygon vertices for every applicable category (normal, utility)
- Usable and unusable fuel per tank
- Fuel flow at the cruise settings actually used
- Take-off and landing distance tables (pressure altitude × temperature × mass × wind × surface)
- Rate of climb table
- IAS→CAS correction table, if published

Aircraft: **Aero AT-3**, **Socata TB-9 Tampico**, **Piper PA-28**, **Piper PA-34**,
**SZD-9 Bocian**, **SZD-50 Puchacz** (gliders: logbook only, no W&B needed).

Until supplied, seeded aircraft carry `data_verified: false` and are marked unverified everywhere
they appear – see [`SAFETY.md`](SAFETY.md) §4.4.

### D-002 · Exact aircraft variants
**Needed for:** ICAO type designators, correct POH edition
**Asked:** 2026-08-28

- Aero AT-3 – R100?
- Piper PA-28 – Warrior / Archer / Cadet, and which model year?
- Piper PA-34 – Seneca II / III / V?
- SZD-9 Bocian – 1E?
- SZD-50 Puchacz – 50-3?

ICAO Doc 8643 designators are looked up by the implementing agent **in the source document**, not
guessed (AGENTS.md rule 2). Only the variants are needed from the owner.

---

## Non-blocking – a default is in place, confirmation would improve it

### D-003 · Attribution in PDF XMP metadata
**Default in effect:** not implemented
**Asked:** 2026-08-28

Printed output carries no attribution, by decision ([`DATA_SOURCES.md`](DATA_SOURCES.md) §10.1).
Embedding attribution in PDF **XMP metadata** (`dc:source`, `xmpRights`) would be invisible on
paper, change the layout by nothing, and still constitute attribution appropriate to the medium.

Costs nothing to add. Owner's call.

### D-004 · Is `/credits` public?
**Default in effect:** inside the authenticated app
**Asked:** 2026-08-28

Should `/credits` be reachable without logging in? A public page is the more usual reading of a
public attribution obligation.

### D-005 · OKL PRz OFP template
**Default in effect:** a generic training template
**Asked:** 2026-08-28

If a PDF or scan of the OFP form used at OKL PRz is available, the "training" template can
reproduce it exactly, which is the difference between a printout that is accepted and one that is
merely correct.

---

## Verification required before release

These are marked ⚠ VERIFY in [`DOMAIN.md`](DOMAIN.md). Each needs checking against its primary
source by someone who can read the regulation, not inferred from secondary material.

| Id | Item | Source to check | Section |
|---|---|---|---|
| V-001 | Fuel reserve minima – exact wording | Reg. (EU) 965/2012 Annex VII, NCO.OP.125, consolidated text | DOMAIN §8.1 |
| V-002 | VFR minimum heights – exact wording | Reg. (EU) 923/2012, SERA.5005(f), consolidated text | DOMAIN §10.1 |
| V-003 | Recency requirements | Part-FCL, FCL.060(b)(1) | DOMAIN §11.4 |
| V-004 | Sailplane logbook mandatory fields | SFCL.050 and AMC | DOMAIN §11.3 |
| V-005 | Definition of night, and any ULC/PANSA VFR-day buffer | SERA definitions; AIP Poland GEN | DOMAIN §13 |
| V-006 | MOGAS density | Fuel specification actually used at EPRJ | DOMAIN §8.4 |
| V-007 | CG path with sequenced tanks (PA-34) | PA-34 POH fuel management section | DOMAIN §9.3 |
| V-008 | Compressibility limit for the TAS formula | ICAO Doc 7488 | DOMAIN §5.2 |

---

## Resolved

*(none yet)*
