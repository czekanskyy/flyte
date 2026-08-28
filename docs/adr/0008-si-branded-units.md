# ADR 0008 – SI internally, branded unit types

**Status:** Accepted · **Date:** 2026-08-28 · **Supersedes:** – · **Superseded by:** –

## Context

Mixing feet and metres is the most common class of defect in aviation software, and it is
invisible at runtime: both are numbers. A weight-and-balance sum that silently adds kilograms to
pounds, or a safe altitude computed in metres and rendered as feet, will look like a plausible
answer.

Display units cannot be banned – pilots think in knots, feet, litres and hPa. The mistake is
doing arithmetic in those units, or converting in more than one place.

TypeScript can make mixed-unit arithmetic a compile error with branded types:

```ts
type Metres = number & { readonly __brand: 'm' };
type Feet   = number & { readonly __brand: 'ft' };
const nonsense = metres(5) + feet(3);  // type error
```

The brand is erased at runtime; the numbers stay numbers. The protection is for the author and
for `tsc`, which is the point.

## Decision

1. **SI only inside the codebase:** metres, metres/second, kilograms, kelvin, pascal, seconds,
   radians. Conversion to knots, feet, litres, °C, hPa happens only at the UI boundary, and only
   through `packages/aviation/units`.
2. **Branded types** for every physical quantity. No bare numeric literal for a physical value;
   use a constructor (`feet(3000)`, `knots(90)`).
3. **Factors live in [`DOMAIN.md`](../DOMAIN.md) §1.1** with citations. The implementation may
   not invent a factor. Fuel mass ↔ volume is *not* a unit conversion; it takes an explicit
   density from §8.4.
4. **Unit preferences are display-only.** Changing them never mutates a stored value. A stored
   OFP records the units it was generated in.

## Consequences

- A little ceremony at every UI boundary. That is the cost, and it is accepted.
- Adding a new quantity means a brand, a constructor, both conversion directions, a golden
  vector and a round-trip property test. No vector, no merge.
- Agents must not "simplify" by dropping brands on a helper that "just needs a number". If a
  function takes metres, its parameter type is `Metres`.
