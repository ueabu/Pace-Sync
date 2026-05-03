import type { CourseProfile } from "@/lib/types";

/** Serialize for storage (other workstream owns Supabase writes). */
export function getCourseProfileForPersistence(
  profile: CourseProfile | null
): string | null {
  if (!profile) return null;
  return JSON.stringify(profile);
}

/** Revive from stored JSON. */
export function parseCourseProfileFromPersistence(
  json: string | null | undefined
): CourseProfile | null {
  if (json == null || json === "") return null;
  try {
    const v = JSON.parse(json) as unknown;
    if (!v || typeof v !== "object") return null;
    const o = v as Record<string, unknown>;
    const points = o.points;
    if (!Array.isArray(points) || points.length < 2) return null;
    const parsed: CourseProfile = {
      points: [],
      totalDistanceM: Number(o.totalDistanceM),
      totalAscentM:
        o.totalAscentM === undefined || o.totalAscentM === null
          ? undefined
          : Number(o.totalAscentM),
    };
    if (!Number.isFinite(parsed.totalDistanceM)) return null;
    for (const p of points) {
      if (!p || typeof p !== "object") return null;
      const q = p as Record<string, unknown>;
      const distanceM = Number(q.distanceM);
      const elevationM = Number(q.elevationM);
      if (!Number.isFinite(distanceM) || !Number.isFinite(elevationM))
        return null;
      parsed.points.push({ distanceM, elevationM });
    }
    if (parsed.points.length < 2) return null;
    return parsed;
  } catch {
    return null;
  }
}
