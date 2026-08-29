/**
 * Leg time. docs/DOMAIN.md §7.
 *
 * Display rounds up to the next whole minute. Route totals sum unrounded
 * seconds and round once.
 */
import type { Metres } from "../units/length.ts";
import type { MetresPerSecond } from "../units/speed.ts";
import { minutes, seconds, type Minutes, type Seconds } from "../units/time.ts";

export type LegEteOk = {
  ok: true;
  seconds: Seconds;
};

export type LegEteNoSolution = {
  ok: false;
  reason: "no-solution";
};

export type LegEteResult = LegEteOk | LegEteNoSolution;

export type MinutesCeilOk = {
  ok: true;
  minutes: Minutes;
};

export type MinutesCeilNoSolution = {
  ok: false;
  reason: "no-solution";
};

export type MinutesCeilResult = MinutesCeilOk | MinutesCeilNoSolution;

const NO_SOLUTION = { ok: false, reason: "no-solution" } as const;

const SECONDS_PER_MINUTE = 60;

/**
 * ETE = distance / GS. Zero-length legs are 0 s.
 * Positive distance with GS ≤ 0 is no-solution. docs/DOMAIN.md §7.
 */
export function legEteSeconds(distance: Metres, gs: MetresPerSecond): LegEteResult {
  if (!Number.isFinite(distance) || !Number.isFinite(gs) || distance < 0) {
    return NO_SOLUTION;
  }
  if (distance === 0) {
    return { ok: true, seconds: seconds(0) };
  }
  if (gs <= 0) {
    return NO_SOLUTION;
  }
  const ete = distance / gs;
  if (!Number.isFinite(ete) || ete < 0) {
    return NO_SOLUTION;
  }
  return { ok: true, seconds: seconds(ete) };
}

/** Sum unrounded ETEs. Non-finite input is no-solution. docs/DOMAIN.md §7. */
export function sumDurations(parts: Seconds[]): LegEteResult {
  let total = 0;
  for (const part of parts) {
    if (!Number.isFinite(part) || part < 0) {
      return NO_SOLUTION;
    }
    total += part;
  }
  if (!Number.isFinite(total)) {
    return NO_SOLUTION;
  }
  return { ok: true, seconds: seconds(total) };
}

/**
 * Next whole minute up. 0 s stays 0 min. docs/DOMAIN.md §7.
 */
export function displayMinutesCeil(duration: Seconds): MinutesCeilResult {
  if (!Number.isFinite(duration) || duration < 0) {
    return NO_SOLUTION;
  }
  if (duration === 0) {
    return { ok: true, minutes: minutes(0) };
  }
  return { ok: true, minutes: minutes(Math.ceil(duration / SECONDS_PER_MINUTE)) };
}
