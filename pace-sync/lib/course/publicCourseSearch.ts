import { lonLatLinesFromGeoJsonGeometry } from "@/lib/course/courseFromRoute";
import type { LonLatEle } from "@/lib/course/courseFromRoute";

export type PublicCourseLookupResult =
  | { ok: true; line: LonLatEle[]; source: string }
  | { ok: false; reason: string };

async function fetchJson<T>(
  url: string,
  opts: { fetchImpl?: typeof fetch; headers?: HeadersInit; timeoutMs?: number }
): Promise<{ ok: true; data: T } | { ok: false }> {
  const f = opts.fetchImpl ?? fetch;
  const ac = new AbortController();
  const ms = opts.timeoutMs ?? 10000;
  const t = setTimeout(() => ac.abort(), ms);
  try {
    const res = await f(url, { signal: ac.signal, headers: opts.headers });
    if (!res.ok) return { ok: false };
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(t);
  }
}

type PhotonFc = {
  features?: Array<{
    geometry?: { type?: string; coordinates?: unknown };
    properties?: Record<string, unknown>;
  }>;
};

type NomiHit = {
  geojson?:
    | { type?: string; coordinates?: unknown }
    | Record<string, unknown>;
};

/** Best-effort: Photon line geometry, then Nominatim polygon outline (weak proxy). */
export async function lookupRaceCoursePolylinePublic(
  query: string,
  opts?: {
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
    userAgent?: string;
  }
): Promise<PublicCourseLookupResult> {
  const trimmed = query.trim();
  if (trimmed.length < 3) {
    return { ok: false, reason: "Query too short." };
  }

  const timeoutMs = opts?.timeoutMs ?? 10000;
  const f = opts?.fetchImpl;
  const ua =
    opts?.userAgent ??
    "Pacelist/1.0 (course search; contact: hello@pacelist.invalid)";

  const photonUrl =
    `https://photon.komoot.io/api/?` +
    new URLSearchParams({
      q: trimmed,
      limit: "10",
      lang: "en",
    }).toString();

  const p = await fetchJson<PhotonFc>(photonUrl, {
    fetchImpl: f,
    timeoutMs,
  });
  if (p.ok && Array.isArray(p.data.features)) {
    for (const feat of p.data.features) {
      const geom = feat.geometry;
      if (!geom) continue;
      const line = lonLatLinesFromGeoJsonGeometry(
        geom as { type?: string; coordinates?: unknown }
      );
      if (line && line.length >= 25) {
        return { ok: true, line, source: "photon.komoot.io" };
      }
    }
  }

  /** Nominatim: bounded search; polygon outline as imprecise "course shape" fallback */
  const nomiParams = new URLSearchParams({
    q: trimmed,
    format: "json",
    limit: "5",
    polygon_geojson: "1",
    addressdetails: "0",
  });
  const nomiUrl =
    `https://nominatim.openstreetmap.org/search?${nomiParams.toString()}`;

  const n = await fetchJson<NomiHit[]>(nomiUrl, {
    fetchImpl: f,
    timeoutMs,
    headers: { "User-Agent": ua },
  });
  if (n.ok && Array.isArray(n.data)) {
    for (const hit of n.data) {
      const gj = hit.geojson as { type?: string; coordinates?: unknown } | undefined;
      if (!gj) continue;
      const line = lonLatLinesFromGeoJsonGeometry(gj);
      /** Require some length so random buildings don't become elevation */
      if (line && line.length >= 20) {
        return { ok: true, line, source: "nominatim.openstreetmap.org" };
      }
    }
  }

  return {
    ok: false,
    reason: "No public course geometry found.",
  };
}
