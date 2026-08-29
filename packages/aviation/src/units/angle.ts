/**
 * Angle conversions.
 *
 * Factor: docs/DOMAIN.md §1.1 (SI).
 * Conversions do not round. Storage in the engine is radians.
 */
import { brand } from "./brand.ts";

export type Radians = number & { readonly __brand: "rad" };
export type Degrees = number & { readonly __brand: "deg" };

/** SI. */
const RADIANS_PER_DEGREE = Math.PI / 180;

/** Brand a number as radians. docs/DOMAIN.md §1.1. */
export function radians(value: number): Radians {
  return brand<Radians>(value);
}

/** Brand a number as degrees. docs/DOMAIN.md §1.1. */
export function degrees(value: number): Degrees {
  return brand<Degrees>(value);
}

/** Degrees to radians. Factor pi/180. docs/DOMAIN.md §1.1. */
export function degreesToRadians(value: Degrees): Radians {
  return radians(value * RADIANS_PER_DEGREE);
}

/** Radians to degrees. Inverse of pi/180. docs/DOMAIN.md §1.1. */
export function radiansToDegrees(value: Radians): Degrees {
  return degrees(value / RADIANS_PER_DEGREE);
}
