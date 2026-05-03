import "server-only";

import { SPOTIFY_API_BASE } from "./constants";

const DEFAULT_RETRIES = 3;
const RETRY_AFTER_CAP_SECONDS = 60;

export class SpotifyApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "SpotifyApiError";
    this.status = status;
  }
}

function resolveUrl(pathOrAbsolute: string): string {
  if (
    pathOrAbsolute.startsWith("http://") ||
    pathOrAbsolute.startsWith("https://")
  ) {
    return pathOrAbsolute;
  }
  const slash = pathOrAbsolute.startsWith("/") ? "" : "/";
  return `${SPOTIFY_API_BASE}${slash}${pathOrAbsolute}`;
}

async function sleepMs(ms: number) {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterSeconds(res: Response): number | undefined {
  const raw = res.headers.get("retry-after");
  if (!raw) return undefined;
  const asInt = parseInt(raw, 10);
  if (!Number.isNaN(asInt))
    return Math.min(RETRY_AFTER_CAP_SECONDS, Math.max(0, asInt));
  const date = Date.parse(raw);
  if (!Number.isNaN(date)) {
    const secs = Math.ceil((date - Date.now()) / 1000);
    return Math.min(RETRY_AFTER_CAP_SECONDS, Math.max(0, secs));
  }
  return undefined;
}

export async function spotifyFetch(
  accessToken: string,
  pathOrAbsolute: string,
  init?: RequestInit,
  retriesLeft = DEFAULT_RETRIES,
): Promise<Response> {
  const url = resolveUrl(pathOrAbsolute);
  const merged = new Headers(init?.headers ?? undefined);
  merged.set("Authorization", `Bearer ${accessToken}`);
  if (!merged.has("Accept")) {
    merged.set("Accept", "application/json");
  }

  const res = await fetch(url, {
    ...init,
    headers: merged,
  });

  if (res.status === 429 && retriesLeft > 0) {
    const waitSecs = parseRetryAfterSeconds(res) ?? 2;
    await sleepMs(waitSecs * 1000);
    return spotifyFetch(accessToken, pathOrAbsolute, init, retriesLeft - 1);
  }

  return res;
}

export async function spotifyFetchJson<T>(
  accessToken: string,
  pathOrAbsolute: string,
  init?: RequestInit,
): Promise<T> {
  const res = await spotifyFetch(accessToken, pathOrAbsolute, init);
  if (!res.ok) {
    const text = await res.text();
    throw new SpotifyApiError(
      `Spotify API ${res.status} ${res.statusText}${text ? `: ${text.slice(0, 280)}` : ""}`,
      res.status,
    );
  }
  if (res.status === 204) {
    return undefined as T;
  }
  const text = await res.text();
  return text.length > 0 ? (JSON.parse(text) as T) : (undefined as T);
}
