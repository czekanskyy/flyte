import { describe, expect, it } from "vitest";
import { computeManualOfp } from "./compute-manual-ofp.ts";

describe("computeManualOfp", () => {
  it("matches wind-triangle-001 for WCA, MH and GS", () => {
    const view = computeManualOfp({ tasKt: 100, windDirDeg: 40, windSpeedKt: 20 }, [
      { distanceNm: 50, mtDeg: 90 },
    ]);
    const leg = view.legs[0];
    expect(leg?.status).toBe("ok");
    if (leg?.status !== "ok") {
      return;
    }
    expect(Math.abs(leg.wcaDeg - -8.81)).toBeLessThanOrEqual(0.05);
    expect(Math.abs(leg.mhDeg - 81.19)).toBeLessThanOrEqual(0.05);
    expect(Math.abs(leg.gsKt - 85.96)).toBeLessThanOrEqual(0.05);
  });

  it("ceils the route total once: 90 s + 90 s is 3 min, not 4", () => {
    const view = computeManualOfp({ tasKt: 100, windDirDeg: 90, windSpeedKt: 0 }, [
      { distanceNm: 2.5, mtDeg: 90 },
      { distanceNm: 2.5, mtDeg: 90 },
    ]);
    expect(view.total.status).toBe("ok");
    if (view.total.status !== "ok") {
      return;
    }
    expect(view.total.eteSeconds).toBeCloseTo(180, 6);
    expect(view.total.displayMinutes).toBe(3);
    expect(view.legs.every((leg) => leg.status === "ok" && leg.displayMinutes === 2)).toBe(true);
  });

  it("leaves empty cruise as incomplete, not a number", () => {
    const view = computeManualOfp({ tasKt: null, windDirDeg: 40, windSpeedKt: 20 }, [
      { distanceNm: 10, mtDeg: 90 },
    ]);
    expect(view.legs[0]?.status).toBe("incomplete");
    expect(view.total.status).toBe("incomplete");
  });

  it("returns no-solution when the wind cannot be held", () => {
    const view = computeManualOfp({ tasKt: 50, windDirDeg: 90, windSpeedKt: 80 }, [
      { distanceNm: 10, mtDeg: 90 },
    ]);
    expect(view.legs[0]?.status).toBe("no-solution");
    expect(view.total.status).toBe("no-solution");
  });
});
