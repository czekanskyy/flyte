import { describe, expect, it } from "vitest";
import { isAuthPublicPath } from "./auth-paths.ts";
import { isAeronauticalOrTileRequest } from "./pwa-cache.ts";

describe("PWA runtime cache denylist", () => {
  it("does not intercept OpenStreetMap raster tiles for cache-first", () => {
    expect(
      isAeronauticalOrTileRequest(new URL("https://a.tile.openstreetmap.org/12/2270/1387.png")),
    ).toBe(true);
    expect(isAeronauticalOrTileRequest(new URL("https://tile.openstreetmap.org/0/0/0.png"))).toBe(
      true,
    );
  });

  it("does not intercept OpenAIP or PMTiles", () => {
    expect(isAeronauticalOrTileRequest(new URL("https://api.core.openaip.net/api/airports"))).toBe(
      true,
    );
    expect(isAeronauticalOrTileRequest(new URL("https://cdn.example.com/poland.pmtiles"))).toBe(
      true,
    );
    expect(isAeronauticalOrTileRequest(new URL("https://tiles.example.com/1/2/3.png"))).toBe(true);
  });

  it("still allows same-origin app icons and pages", () => {
    expect(
      isAeronauticalOrTileRequest(new URL("https://flyte.czekanski.dev/icons/icon-192.png")),
    ).toBe(false);
    expect(isAeronauticalOrTileRequest(new URL("https://flyte.czekanski.dev/pl"))).toBe(false);
    expect(isAeronauticalOrTileRequest(new URL("https://flyte.czekanski.dev/api/health"))).toBe(
      false,
    );
  });
});

describe("offline fallback is public", () => {
  it("does not send /offline through the login gate", () => {
    expect(isAuthPublicPath("/offline")).toBe(true);
    expect(isAuthPublicPath("/pl/offline")).toBe(true);
    expect(isAuthPublicPath("/en/offline")).toBe(true);
  });
});
