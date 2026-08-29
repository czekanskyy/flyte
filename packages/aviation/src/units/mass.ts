/**
 * Mass conversions.
 *
 * Factors: docs/DOMAIN.md §1.1 (International Yard and Pound Agreement 1959; NIST SP 811).
 * Conversions do not round.
 */
import { brand } from "./brand.ts";

export type Kilograms = number & { readonly __brand: "kg" };
export type Pounds = number & { readonly __brand: "lb" };

/** International Yard and Pound Agreement (1959); NIST SP 811 footnote 22. */
const KILOGRAMS_PER_POUND = 0.45359237;

/** Brand a number as kilograms. docs/DOMAIN.md §1.1. */
export function kilograms(value: number): Kilograms {
  return brand<Kilograms>(value);
}

/** Brand a number as avoirdupois pounds. docs/DOMAIN.md §1.1. */
export function pounds(value: number): Pounds {
  return brand<Pounds>(value);
}

/** Pounds to kilograms. Factor 0.45359237 (exact). docs/DOMAIN.md §1.1. */
export function poundsToKilograms(value: Pounds): Kilograms {
  return kilograms(value * KILOGRAMS_PER_POUND);
}

/** Kilograms to pounds. Inverse of 0.45359237. docs/DOMAIN.md §1.1. */
export function kilogramsToPounds(value: Kilograms): Pounds {
  return pounds(value / KILOGRAMS_PER_POUND);
}
