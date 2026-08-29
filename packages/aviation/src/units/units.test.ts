import fc from "fast-check";
import { describe, expect, it } from "vitest";
import vectors from "../../test/vectors/units.json";
import {
  celsius,
  celsiusToFahrenheit,
  celsiusToKelvin,
  cubicMetres,
  cubicMetresToLitres,
  degrees,
  degreesToRadians,
  feet,
  feetPerMinute,
  feetPerMinuteToMetresPerSecond,
  feetToMetres,
  fahrenheit,
  fahrenheitToCelsius,
  hectopascals,
  hectopascalsToPascals,
  hours,
  hoursToSeconds,
  imperialGallons,
  imperialGallonsToLitres,
  inchesOfMercury,
  inchesOfMercuryToPascals,
  kelvin,
  kelvinToCelsius,
  kilograms,
  kilogramsToPounds,
  kilometres,
  kilometresPerHour,
  kilometresPerHourToMetresPerSecond,
  kilometresToMetres,
  knots,
  knotsToMetresPerSecond,
  litres,
  litresToCubicMetres,
  litresToImperialGallons,
  litresToUsGallons,
  metres,
  metresPerSecond,
  metresPerSecondToFeetPerMinute,
  metresPerSecondToKilometresPerHour,
  metresPerSecondToKnots,
  metresPerSecondToMilesPerHour,
  metresToFeet,
  metresToKilometres,
  metresToNauticalMiles,
  metresToStatuteMiles,
  milesPerHour,
  milesPerHourToMetresPerSecond,
  minutes,
  minutesToSeconds,
  nauticalMiles,
  nauticalMilesToMetres,
  pascals,
  pascalsToHectopascals,
  pascalsToInchesOfMercury,
  pounds,
  poundsToKilograms,
  radians,
  radiansToDegrees,
  seconds,
  secondsToHours,
  secondsToMinutes,
  statuteMiles,
  statuteMilesToMetres,
  usGallons,
  usGallonsToLitres,
} from "./index.ts";

type ConvertVector = {
  id: string;
  source: string;
  kind: "convert";
  fn: string;
  given: number;
  expect: number;
  tolerance: number;
};

type RoundtripVector = {
  id: string;
  source: string;
  kind: "roundtrip";
  forward: string;
  back: string;
  given: number;
  expect: number;
  tolerance: number;
};

type Vector = ConvertVector | RoundtripVector;

const convert: Record<string, (value: number) => number> = {
  feetToMetres: (value) => feetToMetres(feet(value)),
  metresToFeet: (value) => metresToFeet(metres(value)),
  nauticalMilesToMetres: (value) => nauticalMilesToMetres(nauticalMiles(value)),
  metresToNauticalMiles: (value) => metresToNauticalMiles(metres(value)),
  kilometresToMetres: (value) => kilometresToMetres(kilometres(value)),
  metresToKilometres: (value) => metresToKilometres(metres(value)),
  statuteMilesToMetres: (value) => statuteMilesToMetres(statuteMiles(value)),
  metresToStatuteMiles: (value) => metresToStatuteMiles(metres(value)),
  knotsToMetresPerSecond: (value) => knotsToMetresPerSecond(knots(value)),
  metresPerSecondToKnots: (value) => metresPerSecondToKnots(metresPerSecond(value)),
  kilometresPerHourToMetresPerSecond: (value) =>
    kilometresPerHourToMetresPerSecond(kilometresPerHour(value)),
  metresPerSecondToKilometresPerHour: (value) =>
    metresPerSecondToKilometresPerHour(metresPerSecond(value)),
  feetPerMinuteToMetresPerSecond: (value) => feetPerMinuteToMetresPerSecond(feetPerMinute(value)),
  metresPerSecondToFeetPerMinute: (value) => metresPerSecondToFeetPerMinute(metresPerSecond(value)),
  milesPerHourToMetresPerSecond: (value) => milesPerHourToMetresPerSecond(milesPerHour(value)),
  metresPerSecondToMilesPerHour: (value) => metresPerSecondToMilesPerHour(metresPerSecond(value)),
  poundsToKilograms: (value) => poundsToKilograms(pounds(value)),
  kilogramsToPounds: (value) => kilogramsToPounds(kilograms(value)),
  litresToCubicMetres: (value) => litresToCubicMetres(litres(value)),
  cubicMetresToLitres: (value) => cubicMetresToLitres(cubicMetres(value)),
  usGallonsToLitres: (value) => usGallonsToLitres(usGallons(value)),
  litresToUsGallons: (value) => litresToUsGallons(litres(value)),
  imperialGallonsToLitres: (value) => imperialGallonsToLitres(imperialGallons(value)),
  litresToImperialGallons: (value) => litresToImperialGallons(litres(value)),
  hectopascalsToPascals: (value) => hectopascalsToPascals(hectopascals(value)),
  pascalsToHectopascals: (value) => pascalsToHectopascals(pascals(value)),
  inchesOfMercuryToPascals: (value) => inchesOfMercuryToPascals(inchesOfMercury(value)),
  pascalsToInchesOfMercury: (value) => pascalsToInchesOfMercury(pascals(value)),
  celsiusToKelvin: (value) => celsiusToKelvin(celsius(value)),
  kelvinToCelsius: (value) => kelvinToCelsius(kelvin(value)),
  fahrenheitToCelsius: (value) => fahrenheitToCelsius(fahrenheit(value)),
  celsiusToFahrenheit: (value) => celsiusToFahrenheit(celsius(value)),
  degreesToRadians: (value) => degreesToRadians(degrees(value)),
  radiansToDegrees: (value) => radiansToDegrees(radians(value)),
  minutesToSeconds: (value) => minutesToSeconds(minutes(value)),
  secondsToMinutes: (value) => secondsToMinutes(seconds(value)),
  hoursToSeconds: (value) => hoursToSeconds(hours(value)),
  secondsToHours: (value) => secondsToHours(seconds(value)),
};

const operationalRoundTrips: {
  forward: string;
  back: string;
  min: number;
  max: number;
  /** Skip |x| below this (IEEE underflow / offset cancellation). Not an aviation constant. */
  minAbs?: number;
}[] = [
  { forward: "feetToMetres", back: "metresToFeet", min: -1000, max: 60000 },
  { forward: "nauticalMilesToMetres", back: "metresToNauticalMiles", min: 0, max: 20000 },
  { forward: "kilometresToMetres", back: "metresToKilometres", min: 0, max: 40000 },
  { forward: "statuteMilesToMetres", back: "metresToStatuteMiles", min: 0, max: 25000 },
  { forward: "knotsToMetresPerSecond", back: "metresPerSecondToKnots", min: 0, max: 500 },
  {
    forward: "kilometresPerHourToMetresPerSecond",
    back: "metresPerSecondToKilometresPerHour",
    min: 0,
    max: 900,
  },
  {
    forward: "feetPerMinuteToMetresPerSecond",
    back: "metresPerSecondToFeetPerMinute",
    min: -4000,
    max: 4000,
  },
  {
    forward: "milesPerHourToMetresPerSecond",
    back: "metresPerSecondToMilesPerHour",
    min: 0,
    max: 500,
  },
  { forward: "poundsToKilograms", back: "kilogramsToPounds", min: 0, max: 20000 },
  { forward: "litresToCubicMetres", back: "cubicMetresToLitres", min: 0, max: 2000 },
  { forward: "usGallonsToLitres", back: "litresToUsGallons", min: 0, max: 500 },
  { forward: "imperialGallonsToLitres", back: "litresToImperialGallons", min: 0, max: 500 },
  { forward: "hectopascalsToPascals", back: "pascalsToHectopascals", min: 100, max: 1100 },
  { forward: "inchesOfMercuryToPascals", back: "pascalsToInchesOfMercury", min: 5, max: 40 },
  // Offset conversions: relative 1e-9 cannot hold for |t| << ULP(273.15)/1e-9.
  { forward: "celsiusToKelvin", back: "kelvinToCelsius", min: -90, max: 60, minAbs: 0.01 },
  {
    forward: "fahrenheitToCelsius",
    back: "celsiusToFahrenheit",
    min: -130,
    max: 140,
    minAbs: 0.01,
  },
  { forward: "degreesToRadians", back: "radiansToDegrees", min: -720, max: 720 },
  { forward: "minutesToSeconds", back: "secondsToMinutes", min: 0, max: 1440 },
  { forward: "hoursToSeconds", back: "secondsToHours", min: 0, max: 24 },
];

/** Relative 1e-9 with one ulp of absolute slack so the bound is not itself a false failure. */
function withinRelative(actual: number, expected: number, relTol: number): boolean {
  if (actual === expected) {
    return true;
  }
  const diff = Math.abs(actual - expected);
  const scale = Math.max(Math.abs(actual), Math.abs(expected));
  if (scale === 0) {
    return diff === 0;
  }
  return diff <= relTol * scale + Number.EPSILON;
}

function lookup(name: string): (value: number) => number {
  const fn = convert[name];
  if (!fn) {
    throw new Error(`Unknown conversion ${name}`);
  }
  return fn;
}

function isVector(value: unknown): value is Vector {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (!("id" in value) || !("source" in value) || !("kind" in value)) {
    return false;
  }
  return (
    typeof value.id === "string" &&
    typeof value.source === "string" &&
    (value.kind === "convert" || value.kind === "roundtrip")
  );
}

describe("units golden vectors", () => {
  it("every vector has id, source, and a known conversion", () => {
    expect(vectors.length).toBeGreaterThan(0);
    for (const raw of vectors) {
      expect(isVector(raw)).toBe(true);
      const vector = raw as Vector;
      expect(vector.id.length).toBeGreaterThan(0);
      expect(vector.source.length).toBeGreaterThan(8);
      if (vector.kind === "convert") {
        expect(convert[vector.fn]).toBeTypeOf("function");
      } else {
        expect(convert[vector.forward]).toBeTypeOf("function");
        expect(convert[vector.back]).toBeTypeOf("function");
      }
    }
  });

  for (const raw of vectors) {
    const vector = raw as Vector;
    it(vector.id, () => {
      if (vector.kind === "convert") {
        const actual = lookup(vector.fn)(vector.given);
        if (vector.tolerance === 0) {
          expect(actual).toBe(vector.expect);
        } else {
          expect(Math.abs(actual - vector.expect)).toBeLessThanOrEqual(vector.tolerance);
        }
        return;
      }
      const actual = lookup(vector.back)(lookup(vector.forward)(vector.given));
      expect(withinRelative(actual, vector.expect, vector.tolerance)).toBe(true);
    });
  }
});

describe("units knot factor", () => {
  it("uses 1852/3600, not the Annex 5 Table 3-3 six-digit printout", () => {
    const oneKnot = knotsToMetresPerSecond(knots(1));
    expect(oneKnot).toBe(1852 / 3600);
    expect(oneKnot).not.toBe(0.514444);
  });
});

describe("units constructors", () => {
  it("erase to the same runtime number", () => {
    expect(feet(3000)).toBe(3000);
    expect(knots(90)).toBe(90);
    expect(celsius(15)).toBe(15);
  });
});

describe("units round-trip properties", () => {
  for (const pair of operationalRoundTrips) {
    it(`${pair.forward} then ${pair.back} within 1e-9 relative`, () => {
      const forward = lookup(pair.forward);
      const back = lookup(pair.back);
      fc.assert(
        fc.property(fc.double({ min: pair.min, max: pair.max, noNaN: true }), (value) => {
          // Subnormals underflow under a linear factor; they are not operational.
          const minAbs = pair.minAbs ?? 1e-6;
          fc.pre(value === 0 || Math.abs(value) >= minAbs);
          const actual = back(forward(value));
          return withinRelative(actual, value, 1e-9);
        }),
        { numRuns: 100 },
      );
    });
  }
});

describe("units finite output", () => {
  it("no public conversion returns NaN or Infinity for finite operational input", () => {
    const names = Object.keys(convert);
    const first = names[0];
    if (first === undefined) {
      throw new Error("conversion registry is empty");
    }
    fc.assert(
      fc.property(
        fc.constantFrom(first, ...names.slice(1)),
        fc.double({ min: -1e6, max: 1e6, noNaN: true }),
        (name, value) => Number.isFinite(lookup(name)(value)),
      ),
      { numRuns: 400 },
    );
  });
});
