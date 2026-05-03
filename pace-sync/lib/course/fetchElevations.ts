import type { LonLatEle } from "@/lib/course/courseFromRoute";

/** POST batch to Open-Elevation (public, no API key); returns nullable list aligned to input length. */
export async function fetchOpenElevationMeters(
  points: LonLatEle[],
  opts?: {
    chunkSize?: number;
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
  }
): Promise<(number | null)[]> {
  const f = opts?.fetchImpl ?? fetch;
  const chunk = opts?.chunkSize ?? 120;
  const timeoutMs = opts?.timeoutMs ?? 8000;
  const out: (number | null)[] = new Array(points.length).fill(null);

  for (let start = 0; start < points.length; start += chunk) {
    const slice = points.slice(start, Math.min(points.length, start + chunk));
    const body = JSON.stringify({
      locations: slice.map((p) => ({
        latitude: p.lat,
        longitude: p.lon,
      })),
    });
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const res = await f("https://api.open-elevation.com/v1/lookup", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body,
        signal: ac.signal,
      });
      if (!res.ok) continue;
      const data = (await res.json()) as {
        results?: { elevation?: number }[];
      };
      const rs = data.results;
      if (!Array.isArray(rs)) continue;
      for (let i = 0; i < slice.length && i < rs.length; i++) {
        const ev = rs[i]?.elevation;
        out[start + i] =
          typeof ev === "number" && Number.isFinite(ev) ? ev : null;
      }
    } catch {
      /* fail soft */
    } finally {
      clearTimeout(t);
    }
  }
  return out;
}
