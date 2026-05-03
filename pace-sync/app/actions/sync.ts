"use server";

import { getSession } from "@/lib/auth/session";
import { createPlaylist, replacePlaylistTracks } from "@/lib/spotify/sync";

export type SyncActionResult =
  | { ok: true; spotifyUrl: string; message: string }
  | { ok: false; error: string };

export async function syncNewPlaylist(
  name: string,
  trackUris: string[],
): Promise<SyncActionResult> {
  const session = await getSession();
  if (session.status !== "authed" || !session.accessToken) {
    return { ok: false, error: "Not signed in" };
  }
  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, error: "Enter a playlist name" };
  }
  if (trackUris.length === 0) {
    return { ok: false, error: "No tracks to sync yet" };
  }

  try {
    const result = await createPlaylist({
      accessToken: session.accessToken,
      name: trimmed,
      trackUris,
    });
    return {
      ok: true,
      spotifyUrl: result.spotifyUrl,
      message: `Created “${trimmed}” in Spotify`,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not create playlist",
    };
  }
}

export async function syncReplacePlaylist(
  playlistId: string,
  trackUris: string[],
): Promise<SyncActionResult> {
  const session = await getSession();
  if (session.status !== "authed" || !session.accessToken) {
    return { ok: false, error: "Not signed in" };
  }
  if (!playlistId) {
    return { ok: false, error: "Missing playlist" };
  }
  if (trackUris.length === 0) {
    return { ok: false, error: "No tracks to sync yet" };
  }

  try {
    const result = await replacePlaylistTracks({
      accessToken: session.accessToken,
      playlistId,
      trackUris,
    });
    return {
      ok: true,
      spotifyUrl: result.spotifyUrl,
      message: "Playlist updated in Spotify",
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not update playlist",
    };
  }
}
