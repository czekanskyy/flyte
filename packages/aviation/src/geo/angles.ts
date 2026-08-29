/**
 * Angle wrap. Storage is radians. docs/DOMAIN.md §2.4.
 *
 * `signedDelta` range is (−π, π]; exactly π is positive. JS `%` is not
 * Euclidean modulo – do not use it raw.
 */
import { radians, type Radians } from "../units/angle.ts";

const TAU = 2 * Math.PI;

function euclideanMod(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}

/** Map to [0, 2π). docs/DOMAIN.md §2.4 `normalise360`. */
export function normaliseAngle(theta: Radians): Radians {
  return radians(euclideanMod(theta, TAU));
}

/**
 * Signed difference `a − b` in (−π, π].
 * docs/DOMAIN.md §2.4. Exactly 180° is positive.
 */
export function signedDelta(a: Radians, b: Radians): Radians {
  const wrapped = euclideanMod(a - b, TAU);
  return radians(wrapped > Math.PI ? wrapped - TAU : wrapped);
}
