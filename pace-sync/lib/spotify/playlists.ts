import "server-only";

import type { PlaylistSummary, Track } from "@/lib/types";
import type {
  SpotifyPlaylistSimplified,
  SpotifyPlaylistTrackItem,
  SpotifyTrackObject,
} from "./raw-types";

import { spotifyFetchJson } from "./http";
import { toTrack } from "./map-track";
import { ensureAccessToken } from "./session-cookie";

function toPlaylistSummary(p: SpotifyPlaylistSimplified): PlaylistSummary {
  return {
    id: p.id,
    name: p.name,
    images: p.images,
    tracksTotal: p.tracks?.total ?? undefined,
    public: typeof p.public === "boolean" ? p.public : undefined,
  };
}

async function paginateCollection<T>(
  accessToken: string,
  relativePathWithoutQuery: string,
): Promise<T[]> {
  type SpotifyPageSlice = {
    items: T[];
    next: string | null;
  };

  const first = `${relativePathWithoutQuery}${
    relativePathWithoutQuery.includes("?") ? "&" : "?"
  }limit=50`;
  const items: T[] = [];
  let nextUrl: string | null = first;
  while (nextUrl !== null) {
    const page: SpotifyPageSlice = await spotifyFetchJson<SpotifyPageSlice>(
      accessToken,
      nextUrl,
    );
    items.push(...(page.items ?? []));
    nextUrl = page.next;
  }
  return items;
}

export async function getUserPlaylists(): Promise<PlaylistSummary[]> {
  const token = await ensureAccessToken();
  const raw = await paginateCollection<SpotifyPlaylistSimplified>(
    token,
    "/v1/me/playlists",
  );
  return raw.map(toPlaylistSummary);
}

export async function getPlaylistTracks(
  playlistId: string,
): Promise<{ items: Track[] }> {
  const token = await ensureAccessToken();
  const rows = await paginateCollection<SpotifyPlaylistTrackItem>(
    token,
    `/v1/playlists/${encodeURIComponent(playlistId)}/tracks`,
  );
  const tracks: Track[] = [];
  for (const row of rows) {
    const t = toTrack(row.track ?? undefined);
    if (t) tracks.push(t);
  }
  return { items: tracks };
}

export async function searchTracks(
  query: string,
  opts?: { limit?: number },
): Promise<{ items: Track[] }> {
  const token = await ensureAccessToken();
  const limit = Math.min(opts?.limit ?? 50, 50);
  const q = encodeURIComponent(query);
  const page = await spotifyFetchJson<{
    tracks?: { items?: SpotifyTrackObject[] };
  }>(token, `/v1/search?q=${q}&type=track&limit=${limit}`);

  const items: Track[] = [];
  for (const raw of page.tracks?.items ?? []) {
    const t = toTrack(raw);
    if (t) items.push(t);
  }
  return { items };
}

export async function createPlaylist(args: {
  name: string;
  public?: boolean;
}): Promise<{ id: string; name: string }> {
  const token = await ensureAccessToken();
  const me = await spotifyFetchJson<{ id: string }>(token, "/v1/me");
  const playlist = await spotifyFetchJson<{ id: string; name: string }>(
    token,
    `/v1/users/${encodeURIComponent(me.id)}/playlists`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: args.name,
        public: args.public ?? false,
      }),
    },
  );
  return { id: playlist.id, name: playlist.name };
}

const REPLACE_BATCH = 100;

export async function replacePlaylistTracks(
  playlistId: string,
  trackIds: string[],
): Promise<void> {
  const token = await ensureAccessToken();
  const uris = trackIds.map((id) => `spotify:track:${id}`);

  if (uris.length === 0) {
    await spotifyFetchJson<unknown>(
      token,
      `/v1/playlists/${encodeURIComponent(playlistId)}/tracks`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uris: [] }),
      },
    );
    return;
  }

  const firstSlice = uris.slice(0, REPLACE_BATCH);
  await spotifyFetchJson<unknown>(
    token,
    `/v1/playlists/${encodeURIComponent(playlistId)}/tracks`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uris: firstSlice }),
    },
  );

  for (let i = REPLACE_BATCH; i < uris.length; i += REPLACE_BATCH) {
    const slice = uris.slice(i, i + REPLACE_BATCH);
    await spotifyFetchJson<{ snapshot_id?: string }>(
      token,
      `/v1/playlists/${encodeURIComponent(playlistId)}/tracks`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uris: slice,
        }),
      },
    );
  }
}
