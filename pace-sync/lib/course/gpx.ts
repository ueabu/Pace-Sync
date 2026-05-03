import type { CourseProfile, CourseProfilePoint } from "@/lib/types";
import { haversineM } from "@/lib/course/haversine";

const MAX_POINTS = 2500;

function text(el: Element | null, localName: string): string | null {
  if (!el) return null;
  const c = el.getElementsByTagNameNS("*", localName)[0];
  return c?.textContent?.trim() ?? null;
}

function parseNum(s: string | null): number | null {
  if (s == null || s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Downsample by keeping every k-th point plus last. */
function downsample(
  points: CourseProfilePoint[],
  max: number
): CourseProfilePoint[] {
  if (points.length <= max) return points;
  const step = Math.ceil(points.length / max);
  const out: CourseProfilePoint[] = [];
  for (let i = 0; i < points.length - 1; i += step) {
    out.push(points[i]!);
  }
  out.push(points[points.length - 1]!);
  return out;
}

function totalAscent(points: CourseProfilePoint[]): number {
  let a = 0;
  for (let i = 1; i < points.length; i++) {
    const d = points[i]!.elevationM - points[i - 1]!.elevationM;
    if (d > 0) a += d;
  }
  return a;
}

export function validateGpx(xml: string): { ok: boolean; error?: string } {
  const t = xml.trim();
  if (!t) return { ok: false, error: "Empty file." };
  if (!t.includes("<gpx") || !t.includes("</gpx>")) {
    return { ok: false, error: "Not a GPX document (missing gpx root)." };
  }
  return { ok: true };
}

/**
 * Parse GPX 1.0/1.1 track or route points into a course profile.
 * Distance is cumulative 2D path length; elevation from <ele> or 0.
 */
export function parseGpx(xml: string): CourseProfile {
  const v = validateGpx(xml);
  if (!v.ok) throw new Error(v.error);

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    throw new Error("Invalid XML.");
  }

  const root = doc.documentElement;
  if (!root || root.localName !== "gpx") {
    throw new Error("Missing GPX root element.");
  }

  type Sample = { lat: number; lon: number; ele: number };
  const samples: Sample[] = [];

  const trkpts = root.getElementsByTagNameNS("*", "trkpt");
  for (let i = 0; i < trkpts.length; i++) {
    const el = trkpts[i]!;
    const lat = parseNum(el.getAttribute("lat"));
    const lon = parseNum(el.getAttribute("lon"));
    if (lat == null || lon == null) continue;
    const ele = parseNum(text(el, "ele")) ?? 0;
    samples.push({ lat, lon, ele });
  }

  if (samples.length === 0) {
    const rtepts = root.getElementsByTagNameNS("*", "rtept");
    for (let i = 0; i < rtepts.length; i++) {
      const el = rtepts[i]!;
      const lat = parseNum(el.getAttribute("lat"));
      const lon = parseNum(el.getAttribute("lon"));
      if (lat == null || lon == null) continue;
      const ele = parseNum(text(el, "ele")) ?? 0;
      samples.push({ lat, lon, ele });
    }
  }

  if (samples.length < 2) {
    throw new Error(
      "GPX has too few points (need at least two trkpt or rtept)."
    );
  }

  const points: CourseProfilePoint[] = [];
  let dist = 0;
  points.push({
    distanceM: 0,
    elevationM: samples[0]!.ele,
  });

  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1]!;
    const b = samples[i]!;
    const seg = haversineM(a.lat, a.lon, b.lat, b.lon);
    dist += seg;
    points.push({
      distanceM: dist,
      elevationM: b.ele,
    });
  }

  const trimmed = downsample(points, MAX_POINTS);
  const totalDistanceM = trimmed[trimmed.length - 1]?.distanceM ?? 0;
  return {
    points: trimmed,
    totalDistanceM,
    totalAscentM: totalAscent(trimmed),
  };
}
