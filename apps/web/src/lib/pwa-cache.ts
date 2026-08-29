/**
 * Runtime-cache denylist for the service worker (ARCHITECTURE.md §5).
 * Map tiles, OpenAIP and PMTiles must never be cache-first.
 */
export function isAeronauticalOrTileRequest(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  const path = url.pathname.toLowerCase();
  if (path.endsWith(".pmtiles") || path.includes(".pmtiles")) {
    return true;
  }
  if (host.includes("openaip") || path.includes("openaip")) {
    return true;
  }
  if (
    host.includes("openstreetmap") ||
    host.includes("openstreetmap.fr") ||
    host.includes("osm.")
  ) {
    return true;
  }
  if (/(^|\.)tile\./i.test(host) || host.includes("tiles.")) {
    return true;
  }
  if (path.includes("/tiles/") || path.includes("/tile/")) {
    return true;
  }
  return false;
}
