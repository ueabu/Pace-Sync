import "server-only";

import { spotifyFetch } from "@/lib/spotify/http";
import type { SpotifyPlaylistSummary } from "@/lib/spotify/types";

type PagedPlaylists = {
  items: Array<{
    id: string;
    name: string;
    images: Array<{ url: string }>;
    tracks: { total: number };
  }>;
  next: string | null;
};

type PlaylistTracksResponse = {
  items: Array<{ track: { uri: string } | null }>;
  next: string | null;
};

function mapPlaylistItem(
  item: PagedPlaylists["items"][number],
): SpotifyPlaylistSummary {
  const cover = item.images?.[0]?.url ?? null;
  return {
    id: item.id,
    name: item.name,
    coverUrl: cover,
    trackCount: item.tracks?.total ?? 0,
  };
}

/** List the current user's playlists (paginated up to `maxPages`). */
export async function fetchUserPlaylists(
  accessToken: string,
  maxPages = 3,
): Promise<SpotifyPlaylistSummary[]> {
  const out: SpotifyPlaylistSummary[] = [];
  let path: string | null = "/me/playlists?limit=50";

  for (let page = 0; page < maxPages && path; page++) {
    const data: PagedPlaylists = await spotifyFetch<PagedPlaylists>(
      accessToken,
      path,
    );
    for (const item of data.items) {
      out.push(mapPlaylistItem(item));
    }
    if (data.next) {
      const nextUrl = new URL(data.next);
      path = `${nextUrl.pathname}${nextUrl.search}`;
    } else {
      path = null;
    }
  }

  return out;
}

/** Ordered `spotify:track:` URIs for a playlist (local/null tracks skipped). */
export async function fetchPlaylistTrackUris(
  accessToken: string,
  playlistId: string,
  maxPages = 20,
): Promise<string[]> {
  const uris: string[] = [];
  let path: string | null = `/playlists/${playlistId}/tracks?limit=100`;

  for (let page = 0; page < maxPages && path; page++) {
    const data: PlaylistTracksResponse = await spotifyFetch<PlaylistTracksResponse>(
      accessToken,
      path,
    );
    for (const row of data.items) {
      const uri = row.track?.uri;
      if (uri?.startsWith("spotify:track:")) uris.push(uri);
    }
    if (data.next) {
      path = data.next.replace("https://api.spotify.com/v1", "");
    } else {
      path = null;
    }
  }

  return uris;
}
