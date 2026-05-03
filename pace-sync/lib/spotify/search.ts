import type { SpotifySearchTrack } from "./types";

type SpotifySearchResponse = {
  tracks?: {
    items?: Array<{
      id: string;
      name: string;
      duration_ms: number;
      artists: Array<{ name: string }>;
      uri?: string;
    }>;
  };
};

async function getClientCredentialsToken(): Promise<string | null> {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) return null;

  const body = new URLSearchParams({ grant_type: "client_credentials" });
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body,
    cache: "no-store",
  });

  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string };
  return json.access_token ?? null;
}

function mockResults(query: string): SpotifySearchTrack[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return [
    {
      id: `mock-${q}-1`,
      name: `${query.trim()} (demo A)`,
      artists: ["Pacelist Demo"],
      durationMs: 215_000,
    },
    {
      id: `mock-${q}-2`,
      name: `${query.trim()} (demo B)`,
      artists: ["Studio Session"],
      durationMs: 198_000,
    },
  ];
}

function mapItems(items: SpotifySearchResponse["tracks"]): SpotifySearchTrack[] {
  if (!items?.items?.length) return [];
  return items.items.map((t) => ({
    id: t.id,
    name: t.name,
    artists: t.artists.map((a) => a.name),
    durationMs: t.duration_ms,
    uri: t.uri,
  }));
}

/**
 * Server-side Spotify track search. Uses client credentials when configured;
 * otherwise returns small demo tracks so the timeline UI stays usable locally.
 */
export async function searchSpotifyTracks(
  query: string,
): Promise<SpotifySearchTrack[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const token = await getClientCredentialsToken();
  if (!token) {
    return mockResults(trimmed);
  }

  const params = new URLSearchParams({
    q: trimmed,
    type: "track",
    limit: "12",
  });

  const res = await fetch(
    `https://api.spotify.com/v1/search?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    return mockResults(trimmed);
  }

  const json = (await res.json()) as SpotifySearchResponse;
  const mapped = mapItems(json.tracks);
  return mapped.length ? mapped : mockResults(trimmed);
}
