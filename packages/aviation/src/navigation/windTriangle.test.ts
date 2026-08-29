import fc from "fast-check";
import { describe, expect, it } from "vitest";
import vectors from "../../test/vectors/navigation.json";
import { degrees, degreesToRadians, radians, radiansToDegrees } from "../units/angle.ts";
import { knots, knotsToMetresPerSecond, metresPerSecondToKnots } from "../units/speed.ts";
import { solveWindTriangle } from "./windTriangle.ts";

type WindTriangleVector = {
  id: string;
  kind: "wind-triangle";
  source: string;
  given: { tc_deg: number; tas_kt: number; wind_dir_deg: number; wind_kt: number };
  expect: { ok: boolean; wca_deg?: number; th_deg?: number; gs_kt?: number };
  tolerance: number;
};

const windVectors = vectors.filter(
  (vector) => vector.kind === "wind-triangle",
) as WindTriangleVector[];

describe("wind triangle golden vectors", () => {
  it("every vector has a source and includes wind-triangle-001", () => {
    expect(windVectors.some((vector) => vector.id === "wind-triangle-001")).toBe(true);
    for (const vector of windVectors) {
      expect(vector.source.length).toBeGreaterThan(8);
    }
  });

  for (const vector of windVectors) {
    it(vector.id, () => {
      const result = solveWindTriangle({
        course: degreesToRadians(degrees(vector.given.tc_deg)),
        tas: knotsToMetresPerSecond(knots(vector.given.tas_kt)),
        windFrom: degreesToRadians(degrees(vector.given.wind_dir_deg)),
        windSpeed: knotsToMetresPerSecond(knots(vector.given.wind_kt)),
      });
      expect(result.ok).toBe(vector.expect.ok);
      if (!vector.expect.ok || !result.ok) {
        return;
      }
      const wca = radiansToDegrees(result.wca);
      const heading = radiansToDegrees(result.heading);
      const gs = metresPerSecondToKnots(result.gs);
      expect(Math.abs(wca - (vector.expect.wca_deg ?? Number.NaN))).toBeLessThanOrEqual(
        vector.tolerance,
      );
      expect(Math.abs(heading - (vector.expect.th_deg ?? Number.NaN))).toBeLessThanOrEqual(
        vector.tolerance,
      );
      expect(Math.abs(gs - (vector.expect.gs_kt ?? Number.NaN))).toBeLessThanOrEqual(
        vector.tolerance,
      );
    });
  }
});

describe("wind triangle invariants", () => {
  it("WS = 0 ⇒ WCA = 0 and GS = TAS", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 250, noNaN: true }),
        fc.double({ min: 0, max: 360, noNaN: true }),
        fc.double({ min: 0, max: 360, noNaN: true }),
        (tasKt, courseDeg, windDeg) => {
          const tas = knotsToMetresPerSecond(knots(tasKt));
          const result = solveWindTriangle({
            course: degreesToRadians(degrees(courseDeg)),
            tas,
            windFrom: degreesToRadians(degrees(windDeg)),
            windSpeed: knotsToMetresPerSecond(knots(0)),
          });
          expect(result.ok).toBe(true);
          if (!result.ok) {
            return;
          }
          expect(result.wca).toBeCloseTo(0, 12);
          expect(result.gs).toBe(tas);
        },
      ),
      { numRuns: 50 },
    );
  });

  it("pure headwind ⇒ WCA = 0 and GS = TAS − WS", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 40, max: 180, noNaN: true }),
        fc.double({ min: 0, max: 35, noNaN: true }),
        fc.double({ min: 0, max: 360, noNaN: true }),
        (tasKt, windKt, courseDeg) => {
          fc.pre(windKt < tasKt);
          const tas = knotsToMetresPerSecond(knots(tasKt));
          const ws = knotsToMetresPerSecond(knots(windKt));
          const course = degreesToRadians(degrees(courseDeg));
          const result = solveWindTriangle({
            course,
            tas,
            windFrom: course,
            windSpeed: ws,
          });
          expect(result.ok).toBe(true);
          if (!result.ok) {
            return;
          }
          expect(Math.abs(result.wca)).toBeLessThan(1e-12);
          expect(Math.abs(result.gs - (tas - ws))).toBeLessThan(1e-9);
        },
      ),
      { numRuns: 40 },
    );
  });

  it("pure tailwind ⇒ WCA = 0 and GS = TAS + WS", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 40, max: 180, noNaN: true }),
        fc.double({ min: 0, max: 40, noNaN: true }),
        fc.double({ min: 0, max: 360, noNaN: true }),
        (tasKt, windKt, courseDeg) => {
          const tas = knotsToMetresPerSecond(knots(tasKt));
          const ws = knotsToMetresPerSecond(knots(windKt));
          const course = degreesToRadians(degrees(courseDeg));
          const result = solveWindTriangle({
            course,
            tas,
            windFrom: radians(course + Math.PI),
            windSpeed: ws,
          });
          expect(result.ok).toBe(true);
          if (!result.ok) {
            return;
          }
          expect(Math.abs(result.wca)).toBeLessThan(1e-9);
          expect(Math.abs(result.gs - (tas + ws))).toBeLessThan(1e-9);
        },
      ),
      { numRuns: 40 },
    );
  });

  it("never returns NaN or Infinity for finite input", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e3, max: 1e3, noNaN: true }),
        fc.double({ min: -50, max: 300, noNaN: true }),
        fc.double({ min: -1e3, max: 1e3, noNaN: true }),
        fc.double({ min: -50, max: 300, noNaN: true }),
        (courseDeg, tasKt, windDeg, windKt) => {
          const result = solveWindTriangle({
            course: degreesToRadians(degrees(courseDeg)),
            tas: knotsToMetresPerSecond(knots(tasKt)),
            windFrom: degreesToRadians(degrees(windDeg)),
            windSpeed: knotsToMetresPerSecond(knots(windKt)),
          });
          if (!result.ok) {
            expect(result.reason).toBe("no-solution");
            return;
          }
          expect(Number.isFinite(result.wca)).toBe(true);
          expect(Number.isFinite(result.heading)).toBe(true);
          expect(Number.isFinite(result.gs)).toBe(true);
        },
      ),
      { numRuns: 200 },
    );
  });
});
