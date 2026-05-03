import type { RacePlan } from "../types";

/** Seconds per kilometer. Returns Infinity when distanceMeters <= 0. */
export function computePace(plan: RacePlan): number {
  const km = plan.distanceMeters / 1000;
  if (km <= 0) return Infinity;
  return plan.targetTimeSeconds / km;
}
