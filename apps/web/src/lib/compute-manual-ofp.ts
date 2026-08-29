/**
 * UI-boundary conversion for the manual /plan table.
 * Arithmetic lives in @flyte/aviation. docs/DOMAIN.md §6.5, §7.
 */
import {
  degrees,
  degreesToRadians,
  displayMinutesCeil,
  knots,
  knotsToMetresPerSecond,
  legEteSeconds,
  metresPerSecondToKnots,
  nauticalMiles,
  nauticalMilesToMetres,
  radiansToDegrees,
  solveWindTriangle,
  sumDurations,
  seconds,
  type Seconds,
} from "@flyte/aviation";

export type CruiseInput = {
  tasKt: number | null;
  windDirDeg: number | null;
  windSpeedKt: number | null;
};

export type LegInput = {
  distanceNm: number | null;
  mtDeg: number | null;
};

export type LegView =
  | { status: "incomplete" }
  | { status: "no-solution" }
  | {
      status: "ok";
      wcaDeg: number;
      mhDeg: number;
      gsKt: number;
      eteSeconds: number;
      displayMinutes: number;
    };

export type TotalView =
  | { status: "incomplete" }
  | { status: "no-solution" }
  | { status: "ok"; eteSeconds: number; displayMinutes: number };

export type ManualOfpView = {
  legs: LegView[];
  total: TotalView;
};

function cruiseReady(cruise: CruiseInput): cruise is {
  tasKt: number;
  windDirDeg: number;
  windSpeedKt: number;
} {
  return cruise.tasKt !== null && cruise.windDirDeg !== null && cruise.windSpeedKt !== null;
}

function legReady(leg: LegInput): leg is { distanceNm: number; mtDeg: number } {
  return leg.distanceNm !== null && leg.mtDeg !== null;
}

function solveLeg(
  tasKt: number,
  windDirDeg: number,
  windSpeedKt: number,
  distanceNm: number,
  mtDeg: number,
): LegView {
  const wind = solveWindTriangle({
    course: degreesToRadians(degrees(mtDeg)),
    tas: knotsToMetresPerSecond(knots(tasKt)),
    windFrom: degreesToRadians(degrees(windDirDeg)),
    windSpeed: knotsToMetresPerSecond(knots(windSpeedKt)),
  });
  if (!wind.ok) {
    return { status: "no-solution" };
  }
  const ete = legEteSeconds(nauticalMilesToMetres(nauticalMiles(distanceNm)), wind.gs);
  if (!ete.ok) {
    return { status: "no-solution" };
  }
  const display = displayMinutesCeil(ete.seconds);
  if (!display.ok) {
    return { status: "no-solution" };
  }
  return {
    status: "ok",
    wcaDeg: radiansToDegrees(wind.wca),
    mhDeg: radiansToDegrees(wind.heading),
    gsKt: metresPerSecondToKnots(wind.gs),
    eteSeconds: ete.seconds,
    displayMinutes: display.minutes,
  };
}

export function computeManualOfp(cruise: CruiseInput, legs: LegInput[]): ManualOfpView {
  if (!cruiseReady(cruise)) {
    return {
      legs: legs.map(() => ({ status: "incomplete" })),
      total: { status: "incomplete" },
    };
  }

  const views = legs.map((leg) => {
    if (!legReady(leg)) {
      return { status: "incomplete" } as const;
    }
    return solveLeg(cruise.tasKt, cruise.windDirDeg, cruise.windSpeedKt, leg.distanceNm, leg.mtDeg);
  });

  if (views.some((view) => view.status === "incomplete")) {
    return { legs: views, total: { status: "incomplete" } };
  }
  if (views.some((view) => view.status === "no-solution")) {
    return { legs: views, total: { status: "no-solution" } };
  }

  const etes: Seconds[] = [];
  for (const view of views) {
    if (view.status !== "ok") {
      return { legs: views, total: { status: "no-solution" } };
    }
    etes.push(seconds(view.eteSeconds));
  }
  const summed = sumDurations(etes);
  if (!summed.ok) {
    return { legs: views, total: { status: "no-solution" } };
  }
  const display = displayMinutesCeil(summed.seconds);
  if (!display.ok) {
    return { legs: views, total: { status: "no-solution" } };
  }
  return {
    legs: views,
    total: { status: "ok", eteSeconds: summed.seconds, displayMinutes: display.minutes },
  };
}
