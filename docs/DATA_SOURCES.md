# DATA_SOURCES.md

Every external data source Flyte uses: endpoint, authentication, limits, licence, and the
attribution obligation that follows from it.

**Architectural rule:** no feature code calls an external API directly. Every source sits behind a
port in `packages/aviation-data/src/ports/` with an adapter in `src/adapters/`. Swapping OpenAIP
for the PANSA AIXM dataset, or the FAA NOTAM API for EAD, must be a one-adapter change.

---

## 1. Aeronautical data – OpenAIP

| | |
|---|---|
| **Base URL** | `https://api.core.openaip.net/api` |
| **Auth** | `x-openaip-client-id: <token>` header, or `apiKey` query parameter. Token from the OpenAIP profile page |
| **Provides** | Airports, navaids, airspaces, reporting points, obstacles, hotspots |
| **Also offers** | TMS raster tiles for airspace/airport overlays (rate-limited; HTTP 429 on excess) |
| **Licence** | **CC BY-NC-SA** |
| **Env** | `OPENAIP_CLIENT_ID` |

**Licence consequences:**
- Non-commercial use only. Flyte is a private, non-commercial project – this is compatible.
- Attribution is required. See §8 for exactly how this project does it.
- Share-alike applies to adapted *data*, not to our application code.

**Usage pattern:** we do **not** query OpenAIP at request time. A worker imports the Polish dataset
once per AIRAC cycle into PostGIS (see `packages/aviation-data/src/importers/airac.ts`). The
application only ever reads our own database. This keeps the map fast, keeps us working when
OpenAIP is down, and makes the offline snapshot trivial.

**Known limitation:** coverage of small Polish GA landing sites is incomplete and occasionally
stale. Corrections go in the `aip_overrides` table, sourced from eAIP VFR, each with a source
reference and a date. The UI labels which source each point came from.

---

## 2. Official verification – AIP Poland (PANSA)

| | |
|---|---|
| **eAIP** | `https://www.ais.pansa.pl/` – IFR, VFR and MIL volumes, HTML with printable PDF |
| **AIP Data Set** | AIXM 5.1, **commercial licence required** |
| **Obstacles** | Obstacle Data Sets (AIXM 5.1) and eTOD Area 1 (CSV) |

Not imported automatically. This is the authoritative source used to **verify** OpenAIP data and to
populate `aip_overrides`. Where Flyte and AIP Poland disagree, AIP Poland is right.

The `AeroDataSource` port is designed so that an AIXM 5.1 adapter can replace OpenAIP entirely
should the project ever license the dataset.

---

## 3. Weather – aviationweather.gov (NOAA Aviation Weather Center)

| | |
|---|---|
| **Base URL** | `https://aviationweather.gov/api/data/` |
| **Auth** | None |
| **Provides** | METAR, TAF, SIGMET, AIRMET, G-AIRMET, PIREP; JSON, GeoJSON, XML, IWXXM, raw |
| **Verified** | `?ids=EPWA,EPKK,EPMO&format=json` returns Polish stations – confirmed 2026-08-28 |
| **Update rate** | METAR/SIGMET/PIREP ~1 min · TAF ~10 min · stations daily |

Response fields include `icaoId`, `obsTime`, `reportTime`, `temp`, `dewp`, `wdir`, `wspd`, `visib`,
`altim`, `clouds`, `cover`, `fltCat`, `rawOb`, `lat`, `lon`, `elev`, `name`.

**Operator requirements – these are conditions of use, not suggestions:**
- Send a descriptive `User-Agent` (`Flyte/<version> (+https://flyte.czekanski.dev)`). Generic agents
  get filtered as bots.
- Keep requests small and infrequent. Cache in Redis: METAR 5 min, TAF 30 min, SIGMET 5 min.
- Never poll on a timer from the browser. The server fetches; clients read our cache.

---

## 4. Winds aloft – Open-Meteo

| | |
|---|---|
| **Base URL** | `https://api.open-meteo.com/v1/forecast` |
| **Auth** | None |
| **Provides** | Pressure-level data 1000–100 hPa: wind speed/direction, temperature, geopotential height, humidity, cloud cover |
| **Licence** | Free for non-commercial use |

**This is a critical dependency, not a nice-to-have.** Without winds aloft there is no wind
correction angle, no true ground speed and no honest ETE – the OFP would be arithmetic dressed up
as planning.

Geopotential height converts pressure levels to the altitudes the pilot actually flies. Levels are
interpolated to the planned cruising altitude for each leg.

Cache: 1 hour, keyed by rounded position and forecast hour.

## 5. Elevation – Open-Meteo Elevation API

| | |
|---|---|
| **Base URL** | `https://api.open-meteo.com/v1/elevation` |
| **Auth** | None |
| **Dataset** | Copernicus DEM GLO-90 (90 m) |
| **Batch** | Up to **100 coordinate pairs per request** |

Used for numeric terrain sampling behind the `ElevationSource` port (safe altitude, terrain
profile). Batching matters: a 60 NM leg sampled at 1 NM across a corridor is hundreds of points, so
requests must be chunked at 100 and results cached by route geometry hash.

**Resolution caveat:** 90 m is fine for lowland routes (EPRJ→EPML) and **marginal in the Beskids**
(EPRJ→EPKR). The port exists so Copernicus GLO-30, self-hosted, can replace it without touching
`packages/aviation/terrain`.

`maplibre-gl`'s `queryTerrainElevation()` is **not** an acceptable substitute – it only returns data
for tiles currently loaded in the viewport, so results depend on where the user happens to be
looking. Never use it for a safe-altitude figure.

## 6. Terrain visualisation – AWS Open Data Terrarium tiles

| | |
|---|---|
| **URL** | `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png` |
| **Auth** | None |
| **MapLibre** | `raster-dem` source with `encoding: 'terrarium'` |

Display only – hillshade and 3D terrain on the map. Numeric answers come from §5.

## 7. Polish meteorological data – IMGW

| | |
|---|---|
| **Base URL** | `https://danepubliczne.imgw.pl/api/data/` |
| **Auth** | None |
| **Provides** | Synoptic observations, warnings, precipitation radar, lightning |
| **Licence** | Polish public open data |

Supplementary local context for VFR. IMGW's dedicated *aviation* products are commercial and are
not used.

## 8. NOTAM – FAA NOTAM API ⚠ UNVERIFIED FOR POLAND

| | |
|---|---|
| **Base URL** | `https://external-api.faa.gov/notamapi/v1/notams` |
| **Auth** | `client_id` + `client_secret`, **granted by request only** – email `NOTAMS@faa.gov` |
| **Query** | `icaoLocation`, `domesticLocation`, `notamType`, `responseFormat` |
| **Env** | `FAA_CLIENT_ID`, `FAA_CLIENT_SECRET` |

**Access is not self-service, and may not be granted at all.** The FAA API portal does not issue
NOTAM API credentials on signup: access is requested by email to `NOTAMS@faa.gov`, and operator
eligibility is restricted. A private non-commercial project outside US airspace is not an obvious
candidate for approval.

So there are now two gates, not one: *can we get credentials at all*, and *if so, does the data
cover Poland*. Either failing sends us to the fallback below.

**Nothing may be built on this until `FLY-002` completes.** The FAA redistributes international
NOTAMs, but coverage and currency for `EP**` locations is unconfirmed. A NOTAM module that silently
returns an empty list for Polish aerodromes is worse than no module – it looks like "no NOTAMs".

`FLY-002` must establish: does `icaoLocation=EPRJ|EPML|EPKR|EPWA` return results, are they current,
and how do they compare against the same query in PANSA IWB on the same day?

**If coverage is inadequate**, the module reduces to: a link-out to IWB, plus a paste-your-own-NOTAM
field parsed into the OFP. That fallback is acceptable and honest.

**Regardless of the outcome, PANSA AIS remains the official source** and the UI must say so.

There is no free, legal, programmatic NOTAM source for European airspace – EUROCONTROL EAD requires
a contract. This is a known limitation of the project, not an oversight.

## 9. Ground features for time marks – OpenStreetMap / Overpass

| | |
|---|---|
| **Endpoint** | Public Overpass instances (`overpass-api.de`, mirrors) |
| **Auth** | None; strict fair-use rate limits |
| **Licence** | **ODbL** – attribution required |

Queried features: `waterway=river`, `highway=motorway|trunk`, `railway=rail`, `natural=water`
shorelines, `place=city|town`.

**Rate limits are real.** Query once per route leg bounding box, cache in Redis keyed by rounded
bbox, debounce while the user drags the route. Never query per mouse move.

Phase 7+ replaces this with a local `osm2pgsql` import of the Poland extract if usage justifies it.

---

## 10. Attribution policy

**This is a deliberate decision by the project owner, made with the licence terms in view. It is
recorded here so it is not silently "corrected" later. Do not change it without asking.**

### 10.1 No attribution on printed output

OFP and FPL printouts must match the training organisation's template exactly. Extra elements make
a printout unusable for its purpose. **No licence text, no logos, no credits on any generated
PDF page.**

The visual regression suite asserts this: a test fails if attribution text appears on a rendered
print template.

### 10.2 In-app attribution, scoped to actual use

Attribution appears **only on views that actually consume OpenAIP data**:

| View | Attribution |
|---|---|
| Map, route editor | Discreet credit in the map corner |
| OFP – route section | Credit in the section footer |
| FPL | Credit in the form footer |
| Logbook, E6B, settings, account, auth | **None** |

OpenStreetMap attribution follows the same rule and appears wherever OSM-derived time marks are
shown.

### 10.3 `/credits`

A dedicated page carrying the full detail: every source, its licence, the current AIRAC cycle, data
freshness, and the safety disclaimer. Linked from the footer and from Settings.

### 10.4 Open question

Embedding attribution in **PDF XMP metadata** (`dc:source`, `xmpRights`) would satisfy the
"reasonable to the medium" attribution requirement while remaining completely invisible on the
printed page and changing the layout by nothing at all. Awaiting the owner's decision – see
[`DECISIONS_PENDING.md`](DECISIONS_PENDING.md).

---

## 11. Environment variables

```bash
# Database
DATABASE_URL=                 # Neon connection string (per-lane branch in development)

# Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=https://flyte.czekanski.dev
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Aeronautical data
OPENAIP_CLIENT_ID=

# NOTAM – only after FLY-002 confirms coverage
FAA_CLIENT_ID=
FAA_CLIENT_SECRET=

# Infrastructure
REDIS_URL=
PDF_SERVICE_URL=              # flyte-pdf container

# Identification sent to public APIs
APP_USER_AGENT=Flyte/0.1 (+https://flyte.czekanski.dev)
```

No key is ever exposed to the browser. Every external call is made server-side through a Route
Handler, which also enforces caching and rate limiting.
