import { describe, expect, it } from "vitest";
import vectors from "../../test/vectors/navigation.json";
import { nauticalMiles, nauticalMilesToMetres } from "../units/length.ts";
import { knots, knotsToMetresPerSecond } from "../units/speed.ts";
import { seconds } from "../units/time.ts";
import { displayMinutesCeil, legEteSeconds, sumDurations } from "./legTime.ts";

type EteVector = {
  id: string;
  kind: "ete";
  source: string;
  given: { distance_nm: number; gs_kt: number };
  expect: { ete_s: number };
  tolerance: number;
};

type DisplayCeilVector = {
  id: string;
  kind: "display-ceil";
  source: string;
  given: { ete_s: number };
  expect: { minutes: number };
  tolerance: number;
};

type RouteTotalVector = {
  id: string;
  kind: "route-total";
  source: string;
  given: { ete_s: number[] };
  expect: { total_s: number; display_min: number; sum_of_ceiled_min: number };
  tolerance: number;
};

const eteVectors = vectors.filter((vector) => vector.kind === "ete") as EteVector[];
const ceilVectors = vectors.filter(
  (vector) => vector.kind === "display-ceil",
) as DisplayCeilVector[];
const totalVectors = vectors.filter(
  (vector) => vector.kind === "route-total",
) as RouteTotalVector[];

describe("leg time golden vectors", () => {
  it("every vector has a source", () => {
    expect(eteVectors.length).toBeGreaterThan(0);
    expect(ceilVectors.length).toBeGreaterThan(0);
    expect(totalVectors.length).toBeGreaterThan(0);
    for (const vector of [...eteVectors, ...ceilVectors, ...totalVectors]) {
      expect(vector.source.length).toBeGreaterThan(8);
    }
  });

  for (const vector of eteVectors) {
    it(vector.id, () => {
      const result = legEteSeconds(
        nauticalMilesToMetres(nauticalMiles(vector.given.distance_nm)),
        knotsToMetresPerSecond(knots(vector.given.gs_kt)),
      );
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }
      expect(Math.abs(result.seconds - vector.expect.ete_s)).toBeLessThanOrEqual(vector.tolerance);
    });
  }

  for (const vector of ceilVectors) {
    it(vector.id, () => {
      const result = displayMinutesCeil(seconds(vector.given.ete_s));
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }
      expect(result.minutes).toBe(vector.expect.minutes);
    });
  }

  for (const vector of totalVectors) {
    it(vector.id, () => {
      const parts = vector.given.ete_s.map((value) => seconds(value));
      const summed = sumDurations(parts);
      expect(summed.ok).toBe(true);
      if (!summed.ok) {
        return;
      }
      expect(summed.seconds).toBe(vector.expect.total_s);
      const totalDisplay = displayMinutesCeil(summed.seconds);
      expect(totalDisplay.ok).toBe(true);
      if (!totalDisplay.ok) {
        return;
      }
      expect(totalDisplay.minutes).toBe(vector.expect.display_min);
      let ceiledSum = 0;
      for (const part of parts) {
        const ceiled = displayMinutesCeil(part);
        expect(ceiled.ok).toBe(true);
        if (!ceiled.ok) {
          return;
        }
        ceiledSum += ceiled.minutes;
      }
      expect(ceiledSum).toBe(vector.expect.sum_of_ceiled_min);
      expect(totalDisplay.minutes).not.toBe(ceiledSum);
    });
  }
});
