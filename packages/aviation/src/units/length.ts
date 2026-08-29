/**
 * Length conversions.
 *
 * Factors: docs/DOMAIN.md §1.1 (ICAO Annex 5 Chapter 1; NIST SP 811 Appendix B.8; SI).
 * Conversions do not round.
 */
import { brand } from "./brand.ts";

export type Metres = number & { readonly __brand: "m" };
export type Feet = number & { readonly __brand: "ft" };
export type NauticalMiles = number & { readonly __brand: "NM" };
export type Kilometres = number & { readonly __brand: "km" };
export type StatuteMiles = number & { readonly __brand: "mi" };

/** ICAO Annex 5, 5th ed. (2010), Chapter 1 definition of the foot. */
const METRES_PER_FOOT = 0.3048;
/** ICAO Annex 5, 5th ed. (2010), Chapter 1 definition of the nautical mile. */
const METRES_PER_NAUTICAL_MILE = 1852;
/** SI. */
const METRES_PER_KILOMETRE = 1000;
/** 5280 x 0.3048 m; NIST SP 811 Appendix B.8. */
const METRES_PER_STATUTE_MILE = 1609.344;

/** Brand a number as metres. docs/DOMAIN.md §1.1. */
export function metres(value: number): Metres {
  return brand<Metres>(value);
}

/** Brand a number as feet. docs/DOMAIN.md §1.1. */
export function feet(value: number): Feet {
  return brand<Feet>(value);
}

/** Brand a number as nautical miles. docs/DOMAIN.md §1.1. */
export function nauticalMiles(value: number): NauticalMiles {
  return brand<NauticalMiles>(value);
}

/** Brand a number as kilometres. docs/DOMAIN.md §1.1. */
export function kilometres(value: number): Kilometres {
  return brand<Kilometres>(value);
}

/** Brand a number as statute miles. docs/DOMAIN.md §1.1. */
export function statuteMiles(value: number): StatuteMiles {
  return brand<StatuteMiles>(value);
}

/** Feet to metres. Factor 0.3048 (exact). docs/DOMAIN.md §1.1. */
export function feetToMetres(value: Feet): Metres {
  return metres(value * METRES_PER_FOOT);
}

/** Metres to feet. Inverse of 0.3048. docs/DOMAIN.md §1.1. */
export function metresToFeet(value: Metres): Feet {
  return feet(value / METRES_PER_FOOT);
}

/** Nautical miles to metres. Factor 1852 (exact). docs/DOMAIN.md §1.1. */
export function nauticalMilesToMetres(value: NauticalMiles): Metres {
  return metres(value * METRES_PER_NAUTICAL_MILE);
}

/** Metres to nautical miles. Inverse of 1852. docs/DOMAIN.md §1.1. */
export function metresToNauticalMiles(value: Metres): NauticalMiles {
  return nauticalMiles(value / METRES_PER_NAUTICAL_MILE);
}

/** Kilometres to metres. Factor 1000 (exact). docs/DOMAIN.md §1.1. */
export function kilometresToMetres(value: Kilometres): Metres {
  return metres(value * METRES_PER_KILOMETRE);
}

/** Metres to kilometres. Inverse of 1000. docs/DOMAIN.md §1.1. */
export function metresToKilometres(value: Metres): Kilometres {
  return kilometres(value / METRES_PER_KILOMETRE);
}

/** Statute miles to metres. Factor 1609.344 (exact). docs/DOMAIN.md §1.1. */
export function statuteMilesToMetres(value: StatuteMiles): Metres {
  return metres(value * METRES_PER_STATUTE_MILE);
}

/** Metres to statute miles. Inverse of 1609.344. docs/DOMAIN.md §1.1. */
export function metresToStatuteMiles(value: Metres): StatuteMiles {
  return statuteMiles(value / METRES_PER_STATUTE_MILE);
}
