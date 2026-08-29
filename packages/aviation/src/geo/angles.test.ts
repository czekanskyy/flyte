import { describe, expect, it } from "vitest";
import vectors from "../../test/vectors/navigation.json";
import { degrees, degreesToRadians, radiansToDegrees } from "../units/angle.ts";
import { normaliseAngle, signedDelta } from "./angles.ts";

type SignedDeltaVector = {
  id: string;
  kind: "signed-delta";
  source: string;
  given: { a_deg: number; b_deg: number };
  expect: { delta_deg: number };
  tolerance: number;
};

type NormaliseVector = {
  id: string;
  kind: "normalise";
  source: string;
  given: { deg: number };
  expect: { deg: number };
  tolerance: number;
};

const signedDeltaVectors = vectors.filter(
  (vector) => vector.kind === "signed-delta",
) as SignedDeltaVector[];
const normaliseVectors = vectors.filter(
  (vector) => vector.kind === "normalise",
) as NormaliseVector[];

describe("angle golden vectors", () => {
  it("includes signed-delta and normalise sources", () => {
    expect(signedDeltaVectors.length).toBeGreaterThan(0);
    expect(normaliseVectors.length).toBeGreaterThan(0);
    for (const vector of [...signedDeltaVectors, ...normaliseVectors]) {
      expect(vector.source.length).toBeGreaterThan(8);
    }
  });

  for (const vector of signedDeltaVectors) {
    it(vector.id, () => {
      const actual = radiansToDegrees(
        signedDelta(
          degreesToRadians(degrees(vector.given.a_deg)),
          degreesToRadians(degrees(vector.given.b_deg)),
        ),
      );
      expect(Math.abs(actual - vector.expect.delta_deg)).toBeLessThanOrEqual(vector.tolerance);
    });
  }

  for (const vector of normaliseVectors) {
    it(vector.id, () => {
      const actual = radiansToDegrees(normaliseAngle(degreesToRadians(degrees(vector.given.deg))));
      expect(Math.abs(actual - vector.expect.deg)).toBeLessThanOrEqual(vector.tolerance);
    });
  }
});
