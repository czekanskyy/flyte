/**
 * Temperature conversions.
 *
 * Relations: docs/DOMAIN.md §1.1 (BIPM SI Brochure 9th ed. 2019; NIST SP 811).
 * Conversions do not round. The °F path goes via Celsius, then Kelvin.
 */
import { brand } from "./brand.ts";

export type Kelvin = number & { readonly __brand: "K" };
export type Celsius = number & { readonly __brand: "degC" };
export type Fahrenheit = number & { readonly __brand: "degF" };

/** BIPM SI Brochure 9th ed. (2019); ICAO Annex 5 Chapter 1. */
const KELVIN_CELSIUS_OFFSET = 273.15;

/** Brand a number as kelvin. docs/DOMAIN.md §1.1. */
export function kelvin(value: number): Kelvin {
  return brand<Kelvin>(value);
}

/** Brand a number as degrees Celsius. docs/DOMAIN.md §1.1. */
export function celsius(value: number): Celsius {
  return brand<Celsius>(value);
}

/** Brand a number as degrees Fahrenheit. docs/DOMAIN.md §1.1. */
export function fahrenheit(value: number): Fahrenheit {
  return brand<Fahrenheit>(value);
}

/** Celsius to kelvin. T = t + 273.15. docs/DOMAIN.md §1.1. */
export function celsiusToKelvin(value: Celsius): Kelvin {
  return kelvin(value + KELVIN_CELSIUS_OFFSET);
}

/** Kelvin to Celsius. Inverse of T = t + 273.15. docs/DOMAIN.md §1.1. */
export function kelvinToCelsius(value: Kelvin): Celsius {
  return celsius(value - KELVIN_CELSIUS_OFFSET);
}

/** Fahrenheit to Celsius. t = (t_F - 32) x 5/9. docs/DOMAIN.md §1.1. */
export function fahrenheitToCelsius(value: Fahrenheit): Celsius {
  return celsius((value - 32) * (5 / 9));
}

/** Celsius to Fahrenheit. Inverse of t = (t_F - 32) x 5/9. docs/DOMAIN.md §1.1. */
export function celsiusToFahrenheit(value: Celsius): Fahrenheit {
  return fahrenheit(value * (9 / 5) + 32);
}
