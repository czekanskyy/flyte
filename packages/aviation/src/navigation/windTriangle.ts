/**
 * Wind triangle. docs/DOMAIN.md §6.2.
 *
 * Course, wind-from and heading are one reference frame (§6.5).
 * WCA is positive to the right of track (§6.1).
 */
import { normaliseAngle, signedDelta } from "../geo/angles.ts";
import { radians, type Radians } from "../units/angle.ts";
import { metresPerSecond, type MetresPerSecond } from "../units/speed.ts";

export type WindTriangleInput = {
  course: Radians;
  tas: MetresPerSecond;
  windFrom: Radians;
  windSpeed: MetresPerSecond;
};

export type WindTriangleOk = {
  ok: true;
  wca: Radians;
  heading: Radians;
  gs: MetresPerSecond;
};

export type WindTriangleNoSolution = {
  ok: false;
  reason: "no-solution";
};

export type WindTriangleResult = WindTriangleOk | WindTriangleNoSolution;

const NO_SOLUTION: WindTriangleNoSolution = { ok: false, reason: "no-solution" };

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}

/**
 * Solve for WCA, heading and GS.
 * No-solution when the aircraft cannot hold the course, or GS ≤ 0.
 * docs/DOMAIN.md §6.2, §6.4.
 */
export function solveWindTriangle(input: WindTriangleInput): WindTriangleResult {
  const { course, tas, windFrom, windSpeed } = input;
  if (
    !isFiniteNumber(course) ||
    !isFiniteNumber(tas) ||
    !isFiniteNumber(windFrom) ||
    !isFiniteNumber(windSpeed)
  ) {
    return NO_SOLUTION;
  }
  if (tas <= 0 || windSpeed < 0) {
    return NO_SOLUTION;
  }
  if (windSpeed === 0) {
    return {
      ok: true,
      wca: radians(0),
      heading: normaliseAngle(course),
      gs: tas,
    };
  }

  const delta = signedDelta(windFrom, course);
  const arg = (windSpeed / tas) * Math.sin(delta);
  if (!isFiniteNumber(arg) || Math.abs(arg) > 1) {
    return NO_SOLUTION;
  }

  const wca = Math.asin(arg);
  const heading = normaliseAngle(radians(course + wca));
  const gs = tas * Math.cos(wca) - windSpeed * Math.cos(delta);
  if (!isFiniteNumber(gs) || gs <= 0) {
    return NO_SOLUTION;
  }

  return {
    ok: true,
    wca: radians(wca),
    heading,
    gs: metresPerSecond(gs),
  };
}
