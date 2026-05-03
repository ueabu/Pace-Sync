import type { CourseProfile, CourseProfilePoint } from "@/lib/types";
import { haversineM } from "@/lib/course/haversine";

export type LonLatEle = {
  lon: number;
  lat: number;
  /** Elevation AMSL meters; omit or NaN if unknown — caller fills via API. */
  ele?: number | null;
};

function lineFromGeoJsonCoords(coords: unknown): LonLatEle[] | null {
  if (!Array.isArray(coords)) return null;
  if (coords.length < 2) return null;

  const first = coords[0];
  const isNested =
    Array.isArray(first) && typeof first[0] === "number";

  /** LineString coordinates */
  if (isNested && !Array.isArray((first as number[])[0])) {
    const line: LonLatEle[] = [];
    for (const c of coords as number[][]) {
      const lon = c[0];
      const lat = c[1];
      const ele = c[2];
      if (
        typeof lon !== "number" ||
        typeof lat !== "number" ||
        !Number.isFinite(lon) ||
        !Number.isFinite(lat)
      ) {
        continue;
      }
      line.push({
        lon,
        lat,
        ele:
          typeof ele === "number" && Number.isFinite(ele) ? ele : undefined,
      });
    }
    return line.length >= 2 ? line : null;
  }

  /** Multi-line: pick longest contiguous ring/array of lines */
  if (coords.length >= 2 && Array.isArray(first)) {
    let best: LonLatEle[] | null = null;
    let bestGeom = -1;
    for (const part of coords as unknown[]) {
      const seg = lineFromGeoJsonCoords(part);
      const len = seg?.length ?? 0;
      if (seg && len >= 2 && len > bestGeom) {
        best = seg;
        bestGeom = len;
      }
    }
    return best;
  }

  return null;
}

/** Extract longitude/latitude polyline(s) from a GeoJSON-like geometry object. */
export function lonLatLinesFromGeoJsonGeometry(geom: {
  type?: string;
  coordinates?: unknown;
}): LonLatEle[] | null {
  const { type, coordinates } = geom;
  if (!type || coordinates == null) return null;

  if (type === "LineString") {
    return lineFromGeoJsonCoords(coordinates);
  }
  if (type === "MultiLineString") {
    return lineFromGeoJsonCoords(coordinates);
  }
  if (type === "Polygon") {
    /** Use outer ring */
    const rings = coordinates as unknown[][];
    if (!Array.isArray(rings?.[0])) return null;
    return lineFromGeoJsonCoords(rings[0]);
  }
  if (type === "MultiPolygon") {
    const polys = coordinates as unknown[];
    return lineFromGeoJsonCoords(polys);
  }
  return null;
}

const MAX_ROUTE_POINTS = 400;

/** Downsample a polyline evenly (keeps endpoints). Returns original indices chosen. */
function downsampleLonLat(
  route: LonLatEle[],
  max: number
): { points: LonLatEle[]; origIndices: number[] } {
  if (route.length <= max)
    return {
      points: route,
      origIndices: route.map((_, i) => i),
    };
  const step = Math.ceil(route.length / max);
  const out: LonLatEle[] = [];
  const ix: number[] = [];
  for (let i = 0; i < route.length - 1; i += step) {
    out.push(route[i]!);
    ix.push(i);
  }
  out.push(route[route.length - 1]!);
  ix.push(route.length - 1);
  return { points: out, origIndices: ix };
}

/**
 * Build cumulative distance polyline CourseProfile from WGS84 points with optional elevations.
 */
export function buildCourseProfileFromRoute(
  route: LonLatEle[],
  options?: { elevationM?: (number | null)[] | null }
): CourseProfile {
  if (route.length < 2) {
    throw new Error("Need at least two route points.");
  }
  const { points: r, origIndices } = downsampleLonLat(route, MAX_ROUTE_POINTS);
  const elevRaw = options?.elevationM;
  const pts: CourseProfilePoint[] = [];
  let cum = 0;
  pts.push({
    distanceM: 0,
    elevationM: (() => {
      const oi = origIndices[0] ?? 0;
      const ee = elevRaw?.[oi];
      if (ee != null && Number.isFinite(Number(ee))) return Number(ee);
      const fromPt = route[oi]!;
      return fromPt.ele != null && Number.isFinite(Number(fromPt.ele))
        ? Number(fromPt.ele)
        : 0;
    })(),
  });

  for (let i = 1; i < r.length; i++) {
    const a = r[i - 1]!;
    const b = r[i]!;
    cum += haversineM(a.lat, a.lon, b.lat, b.lon);

    const oi = origIndices[i] ?? i;

    let e = 0;
    const ee = elevRaw?.[oi];
    if (ee != null && Number.isFinite(Number(ee))) {
      e = Number(ee);
    } else if (b.ele != null && Number.isFinite(Number(b.ele))) {
      e = Number(b.ele);
    } else {
      const rr = route[oi]!;
      if (rr.ele != null && Number.isFinite(Number(rr.ele))) {
        e = Number(rr.ele);
      } else {
        const prev = pts[pts.length - 1]!.elevationM;
        e = prev;
      }
    }

    pts.push({ distanceM: cum, elevationM: e });
  }

  let totalAscentM = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = pts[i]!.elevationM - pts[i - 1]!.elevationM;
    if (d > 0) totalAscentM += d;
  }

  return {
    points: pts,
    totalDistanceM: cum,
    totalAscentM,
  };
}
