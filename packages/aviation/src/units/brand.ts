/**
 * Nominal branding. Erased at runtime; the value stays a number (ADR 0008).
 */
export function brand<T>(value: number): T {
  return value as T;
}
