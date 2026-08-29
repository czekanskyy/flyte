/**
 * Pressure conversions.
 *
 * Factors: docs/DOMAIN.md §1.1 (SI prefix; NIST SP 811 conventional inHg).
 * Conversions do not round.
 */
import { brand } from "./brand.ts";

export type Pascals = number & { readonly __brand: "Pa" };
export type Hectopascals = number & { readonly __brand: "hPa" };
export type InchesOfMercury = number & { readonly __brand: "inHg" };

/** SI prefix. 1 hPa = 1 mbar. */
const PASCALS_PER_HECTOPASCAL = 100;
/** NIST SP 811 "inch of mercury, conventional (inHg)". */
const PASCALS_PER_CONVENTIONAL_INCH_OF_MERCURY = 3386.389;

/** Brand a number as pascals. docs/DOMAIN.md §1.1. */
export function pascals(value: number): Pascals {
  return brand<Pascals>(value);
}

/** Brand a number as hectopascals. docs/DOMAIN.md §1.1. */
export function hectopascals(value: number): Hectopascals {
  return brand<Hectopascals>(value);
}

/** Brand a number as conventional inches of mercury. docs/DOMAIN.md §1.1. */
export function inchesOfMercury(value: number): InchesOfMercury {
  return brand<InchesOfMercury>(value);
}

/** Hectopascals to pascals. Factor 100 (exact). docs/DOMAIN.md §1.1. */
export function hectopascalsToPascals(value: Hectopascals): Pascals {
  return pascals(value * PASCALS_PER_HECTOPASCAL);
}

/** Pascals to hectopascals. Inverse of 100. docs/DOMAIN.md §1.1. */
export function pascalsToHectopascals(value: Pascals): Hectopascals {
  return hectopascals(value / PASCALS_PER_HECTOPASCAL);
}

/** Conventional inHg to pascals. Factor 3386.389. docs/DOMAIN.md §1.1. */
export function inchesOfMercuryToPascals(value: InchesOfMercury): Pascals {
  return pascals(value * PASCALS_PER_CONVENTIONAL_INCH_OF_MERCURY);
}

/** Pascals to conventional inHg. Inverse of 3386.389. docs/DOMAIN.md §1.1. */
export function pascalsToInchesOfMercury(value: Pascals): InchesOfMercury {
  return inchesOfMercury(value / PASCALS_PER_CONVENTIONAL_INCH_OF_MERCURY);
}
