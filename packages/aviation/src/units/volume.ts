/**
 * Volume conversions.
 *
 * Factors: docs/DOMAIN.md §1.1 (ICAO Annex 5 Chapter 1; NIST SP 811).
 * Conversions do not round. Fuel mass from volume is not a unit conversion.
 */
import { brand } from "./brand.ts";

export type CubicMetres = number & { readonly __brand: "m3" };
export type Litres = number & { readonly __brand: "L" };
export type UsGallons = number & { readonly __brand: "usgal" };
export type ImperialGallons = number & { readonly __brand: "impgal" };

/** ICAO Annex 5 Chapter 1: 1 L = 1 dm^3. */
const CUBIC_METRES_PER_LITRE = 0.001;
/** 231 in^3, 1 in = 0.0254 m exactly (NIST SP 811). */
const LITRES_PER_US_GALLON = 3.785411784;
/** NIST SP 811 Appendix B.8 (marked exact). */
const LITRES_PER_IMPERIAL_GALLON = 4.54609;

/** Brand a number as cubic metres. docs/DOMAIN.md §1.1. */
export function cubicMetres(value: number): CubicMetres {
  return brand<CubicMetres>(value);
}

/** Brand a number as litres. docs/DOMAIN.md §1.1. */
export function litres(value: number): Litres {
  return brand<Litres>(value);
}

/** Brand a number as US gallons. docs/DOMAIN.md §1.1. */
export function usGallons(value: number): UsGallons {
  return brand<UsGallons>(value);
}

/** Brand a number as imperial gallons. docs/DOMAIN.md §1.1. */
export function imperialGallons(value: number): ImperialGallons {
  return brand<ImperialGallons>(value);
}

/** Litres to cubic metres. Factor 0.001 (exact). docs/DOMAIN.md §1.1. */
export function litresToCubicMetres(value: Litres): CubicMetres {
  return cubicMetres(value * CUBIC_METRES_PER_LITRE);
}

/** Cubic metres to litres. Inverse of 0.001. docs/DOMAIN.md §1.1. */
export function cubicMetresToLitres(value: CubicMetres): Litres {
  return litres(value / CUBIC_METRES_PER_LITRE);
}

/** US gallons to litres. Factor 3.785411784 (exact). docs/DOMAIN.md §1.1. */
export function usGallonsToLitres(value: UsGallons): Litres {
  return litres(value * LITRES_PER_US_GALLON);
}

/** Litres to US gallons. Inverse of 3.785411784. docs/DOMAIN.md §1.1. */
export function litresToUsGallons(value: Litres): UsGallons {
  return usGallons(value / LITRES_PER_US_GALLON);
}

/** Imperial gallons to litres. Factor 4.54609 (exact). docs/DOMAIN.md §1.1. */
export function imperialGallonsToLitres(value: ImperialGallons): Litres {
  return litres(value * LITRES_PER_IMPERIAL_GALLON);
}

/** Litres to imperial gallons. Inverse of 4.54609. docs/DOMAIN.md §1.1. */
export function litresToImperialGallons(value: Litres): ImperialGallons {
  return imperialGallons(value / LITRES_PER_IMPERIAL_GALLON);
}
