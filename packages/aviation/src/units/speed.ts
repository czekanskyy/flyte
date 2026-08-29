/**
 * Speed conversions.
 *
 * Factors: docs/DOMAIN.md §1.1 (derived from the length definitions; SI).
 * Conversions do not round.
 */
import { brand } from "./brand.ts";

export type MetresPerSecond = number & { readonly __brand: "m/s" };
export type Knots = number & { readonly __brand: "kt" };
export type KilometresPerHour = number & { readonly __brand: "km/h" };
export type FeetPerMinute = number & { readonly __brand: "ft/min" };
export type MilesPerHour = number & { readonly __brand: "mph" };

/**
 * 1 kt = 1 NM/h (ICAO Annex 5 Chapter 1). Factor 1852/3600, not the Table 3-3
 * printout 0.514444. docs/DOMAIN.md §1.1.
 */
const METRES_PER_SECOND_PER_KNOT = 1852 / 3600;
/** SI. */
const METRES_PER_SECOND_PER_KILOMETRE_PER_HOUR = 1 / 3.6;
/** Derived from the foot. */
const METRES_PER_SECOND_PER_FOOT_PER_MINUTE = 0.3048 / 60;
/** Derived from the statute mile. */
const METRES_PER_SECOND_PER_MILE_PER_HOUR = 1609.344 / 3600;

/** Brand a number as metres per second. docs/DOMAIN.md §1.1. */
export function metresPerSecond(value: number): MetresPerSecond {
  return brand<MetresPerSecond>(value);
}

/** Brand a number as knots. docs/DOMAIN.md §1.1. */
export function knots(value: number): Knots {
  return brand<Knots>(value);
}

/** Brand a number as kilometres per hour. docs/DOMAIN.md §1.1. */
export function kilometresPerHour(value: number): KilometresPerHour {
  return brand<KilometresPerHour>(value);
}

/** Brand a number as feet per minute. docs/DOMAIN.md §1.1. */
export function feetPerMinute(value: number): FeetPerMinute {
  return brand<FeetPerMinute>(value);
}

/** Brand a number as miles per hour. docs/DOMAIN.md §1.1. */
export function milesPerHour(value: number): MilesPerHour {
  return brand<MilesPerHour>(value);
}

/** Knots to metres per second. Factor 1852/3600. docs/DOMAIN.md §1.1. */
export function knotsToMetresPerSecond(value: Knots): MetresPerSecond {
  return metresPerSecond(value * METRES_PER_SECOND_PER_KNOT);
}

/** Metres per second to knots. Inverse of 1852/3600. docs/DOMAIN.md §1.1. */
export function metresPerSecondToKnots(value: MetresPerSecond): Knots {
  return knots(value / METRES_PER_SECOND_PER_KNOT);
}

/** Kilometres per hour to metres per second. Factor 1/3.6. docs/DOMAIN.md §1.1. */
export function kilometresPerHourToMetresPerSecond(value: KilometresPerHour): MetresPerSecond {
  return metresPerSecond(value * METRES_PER_SECOND_PER_KILOMETRE_PER_HOUR);
}

/** Metres per second to kilometres per hour. Inverse of 1/3.6. docs/DOMAIN.md §1.1. */
export function metresPerSecondToKilometresPerHour(value: MetresPerSecond): KilometresPerHour {
  return kilometresPerHour(value / METRES_PER_SECOND_PER_KILOMETRE_PER_HOUR);
}

/** Feet per minute to metres per second. Factor 0.3048/60. docs/DOMAIN.md §1.1. */
export function feetPerMinuteToMetresPerSecond(value: FeetPerMinute): MetresPerSecond {
  return metresPerSecond(value * METRES_PER_SECOND_PER_FOOT_PER_MINUTE);
}

/** Metres per second to feet per minute. Inverse of 0.3048/60. docs/DOMAIN.md §1.1. */
export function metresPerSecondToFeetPerMinute(value: MetresPerSecond): FeetPerMinute {
  return feetPerMinute(value / METRES_PER_SECOND_PER_FOOT_PER_MINUTE);
}

/** Miles per hour to metres per second. Factor 1609.344/3600. docs/DOMAIN.md §1.1. */
export function milesPerHourToMetresPerSecond(value: MilesPerHour): MetresPerSecond {
  return metresPerSecond(value * METRES_PER_SECOND_PER_MILE_PER_HOUR);
}

/** Metres per second to miles per hour. Inverse of 1609.344/3600. docs/DOMAIN.md §1.1. */
export function metresPerSecondToMilesPerHour(value: MetresPerSecond): MilesPerHour {
  return milesPerHour(value / METRES_PER_SECOND_PER_MILE_PER_HOUR);
}
