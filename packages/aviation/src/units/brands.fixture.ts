/**
 * Type-level fixture compiled by `tsc --noEmit`.
 *
 * TypeScript's `+` on branded numbers yields `number` (the brand is not a
 * runtime unit system). The safety property is assignment: a mixed sum cannot
 * be stored as Metres or Feet, and Feet cannot be assigned to Metres.
 *
 * docs/DOMAIN.md §1.1; ADR 0008.
 */
import { type Feet, type Metres } from "./length.ts";

export function assertBrandSeparation(m: Metres, f: Feet): void {
  // @ts-expect-error -- Feet is not assignable to Metres
  const feetAsMetres: Metres = f;
  // @ts-expect-error -- Metres is not assignable to Feet
  const metresAsFeet: Feet = m;
  const mixed = m + f;
  // @ts-expect-error -- number is not assignable to Metres
  const mixedAsMetres: Metres = mixed;
  // @ts-expect-error -- number is not assignable to Feet
  const mixedAsFeet: Feet = mixed;
  void feetAsMetres;
  void metresAsFeet;
  void mixedAsMetres;
  void mixedAsFeet;
}

export function assertSameBrandSumIsUnbranded(m: Metres): void {
  const sum = m + m;
  // @ts-expect-error -- number is not assignable to Metres
  const asMetres: Metres = sum;
  void asMetres;
}
