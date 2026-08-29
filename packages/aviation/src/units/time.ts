/**
 * Time conversions.
 *
 * Factors: docs/DOMAIN.md §1.1 (SI).
 * Conversions do not round.
 */
import { brand } from "./brand.ts";

export type Seconds = number & { readonly __brand: "s" };
export type Minutes = number & { readonly __brand: "min" };
export type Hours = number & { readonly __brand: "h" };

/** SI. */
const SECONDS_PER_MINUTE = 60;
/** SI. */
const SECONDS_PER_HOUR = 3600;

/** Brand a number as seconds. docs/DOMAIN.md §1.1. */
export function seconds(value: number): Seconds {
  return brand<Seconds>(value);
}

/** Brand a number as minutes. docs/DOMAIN.md §1.1. */
export function minutes(value: number): Minutes {
  return brand<Minutes>(value);
}

/** Brand a number as hours. docs/DOMAIN.md §1.1. */
export function hours(value: number): Hours {
  return brand<Hours>(value);
}

/** Minutes to seconds. Factor 60 (exact). docs/DOMAIN.md §1.1. */
export function minutesToSeconds(value: Minutes): Seconds {
  return seconds(value * SECONDS_PER_MINUTE);
}

/** Seconds to minutes. Inverse of 60. docs/DOMAIN.md §1.1. */
export function secondsToMinutes(value: Seconds): Minutes {
  return minutes(value / SECONDS_PER_MINUTE);
}

/** Hours to seconds. Factor 3600 (exact). docs/DOMAIN.md §1.1. */
export function hoursToSeconds(value: Hours): Seconds {
  return seconds(value * SECONDS_PER_HOUR);
}

/** Seconds to hours. Inverse of 3600. docs/DOMAIN.md §1.1. */
export function secondsToHours(value: Seconds): Hours {
  return hours(value / SECONDS_PER_HOUR);
}
