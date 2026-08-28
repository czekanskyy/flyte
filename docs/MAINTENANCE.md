# MAINTENANCE.md

Recurring obligations. Aeronautical software decays on a schedule – data cycles expire, models
reach the end of their validity period, regulations are amended. Each item below has an owner, a
trigger and a consequence for missing it.

---

## Calendar

| Item | Every | Next due | Miss consequence |
|---|---|---|---|
| AIRAC data import | 28 days | Automated (worker cron) | Expired-cycle banner; planning against stale airspace |
| Dependency version audit | Start of each phase | Phase 1 | Building on assumptions instead of facts |
| **WMM coefficient renewal** | 5 years | **before 2030-01-01** | Magnetic headings silently wrong and getting worse |
| Regulatory review (Part-NCO, SERA, Part-FCL) | Annually | 2027-08 | Fuel minima or VFR limits no longer match law |
| Golden vector audit | Each phase | Phase 1 | Vectors drift toward implementation instead of truth |
| Certificate and secret rotation | Annually | 2027-08 | Outage |

---

## AIRAC cycle – every 28 days

Automated in `flyte-worker`. The import runs, verifies the row counts are within a sane band of the
previous cycle, and only then swaps the active cycle.

**Manual attention needed when:** the import fails twice in a row, row counts move by more than
±10 %, or OpenAIP changes its schema.

Never let an import that returned suspiciously little data become the active cycle. A half-imported
airspace dataset is more dangerous than an expired complete one, because the expiry banner is the
only thing that would have warned the pilot.

## WMM 2025 → WMM 2030 – before 2030-01-01

**This is the single most easily forgotten item in the project, and one of the most consequential.**

WMM2025 is valid 2025-01-01 to 2029-12-31. After that the model degrades continuously – and
silently. Nothing throws; headings just become progressively wrong.

When WMM2030 is published (expected late 2029 by NOAA NCEI / NGA / BGS):

1. Replace the coefficient file in `packages/aviation/src/magnetic/coefficients/`.
2. Replace the golden vectors with NOAA's official WMM2030 test values.
3. Update the validity window constant.
4. Confirm that a date outside the validity window returns an explicit error, not a silently
   extrapolated value.

**Point 4 must already be true today.** Requesting a declination for 2031 from a WMM2025 model must
fail loudly. Verify it with a test now, not in 2029.

## Dependency audit – start of each phase

```bash
npm view <package> version          # actual current release
pnpm outdated -r
```

Do **not** trust an agent's recollection of what version is current. On 2026-08-28 that recollection
would have been wrong about MapLibre, ESLint, Vitest and TanStack Table simultaneously.

Standing constraint: `typescript` stays inside `typescript-eslint`'s peer range –
[ADR 0002](adr/0002-typescript-version.md) has the exit condition. Check whether it has been met;
if so, migrate.

## Regulatory review – annually

Every ⚠ VERIFY item in [`DOMAIN.md`](DOMAIN.md) is re-checked against the **current consolidated
text**, not against secondary sources:

- Reg. (EU) 965/2012 Annex VII (Part-NCO) – fuel minima
- Reg. (EU) 923/2012 (SERA) – VFR minimum heights, definition of night
- Reg. (EU) 1178/2011 Annex I (Part-FCL) – logbook format, recency
- SFCL – sailplane licensing
- AIP Poland GEN – national differences

A change here is not a routine update. If a fuel minimum changes, existing stored OFPs were
generated under the old rule and must remain reproducible – which is precisely why OFP snapshots
record the calculation engine version.

## Golden vector audit – each phase

Sample ten vectors and re-derive them from the primary source. The failure mode being hunted is
subtle: a vector quietly adjusted at some point to make a test pass, which then permanently encodes
a defect as expected behaviour.

Check specifically:
- Does every vector still have a `source` naming something outside this codebase?
- Does the git history show any vector modified in the same commit as an implementation fix? That
  pattern is a red flag and warrants reading the diff.

## Secrets and certificates – annually

Rotate: `BETTER_AUTH_SECRET`, Google OAuth client secret, OpenAIP client id, FAA credentials, the
Cloudflare Tunnel token, database credentials.

Rotating `BETTER_AUTH_SECRET` invalidates every session. Do it deliberately, not on a Friday.

---

## Deferred work, with its trigger

| Deferred | Revisit when |
|---|---|
| Copernicus GLO-30 self-hosted elevation | Safe altitudes in the Beskids prove insufficiently accurate in pilot validation |
| Local PostGIS with a full OSM import | Overpass rate limits become a real constraint on time marks |
| Offline map tiles (PMTiles) | v1 has shipped and offline map use is genuinely missed |
| NOTAM integration | FLY-002 reports; re-evaluate if EAD access ever becomes available |
| TypeScript 7 migration | `typescript-eslint` declares TS 7 support |
| bun as package manager | CI install time becomes a measured bottleneck |
