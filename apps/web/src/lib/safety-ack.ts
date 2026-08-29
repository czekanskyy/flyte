/**
 * First-run safety acknowledgement gate (docs/SAFETY.md §1.1).
 *
 * Bump SAFETY_ACK_VERSION when the on-screen wording changes so existing users
 * are re-prompted. Do not paraphrase the statement in messages/*.
 */
export const SAFETY_ACK_VERSION = "safety-1.1";

export function planningIsAllowed(acknowledgedVersion: string | null | undefined): boolean {
  return acknowledgedVersion === SAFETY_ACK_VERSION;
}

/**
 * Where a signed-in user should land when they ask for planning.
 * `/plan` is only reachable with the current acknowledgement version.
 */
export function planningDestination(
  acknowledgedVersion: string | null | undefined,
): "/plan" | "/acknowledge" {
  return planningIsAllowed(acknowledgedVersion) ? "/plan" : "/acknowledge";
}
