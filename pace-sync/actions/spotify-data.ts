"use server";

import type { PlaylistSummary, Track } from "@/lib/types";
import {
  createPlaylist as createPlaylistSvc,
  getPlaylistTracks as getPlaylistTracksSvc,
  getUserPlaylists as getUserPlaylistsSvc,
  replacePlaylistTracks as replacePlaylistTracksSvc,
  searchTracks as searchTracksSvc,
} from "@/lib/spotify/playlists";

export type { PlaylistSummary, Track } from "@/lib/types";

export { SPOTIFY_AUTH_PATH } from "@/lib/spotify/constants";

export async function listSpotifyPlaylists(): Promise<PlaylistSummary[]> {
  return getUserPlaylistsSvc();
}

export async function listSpotifyPlaylistTracks(
  playlistId: string,
): Promise<{ items: Track[] }> {
  return getPlaylistTracksSvc(playlistId);
}

export async function searchSpotifyTracks(
  query: string,
  options?: { limit?: number },
): Promise<{ items: Track[] }> {
  return searchTracksSvc(query, options);
}

export async function spotifyCreatePlaylist(args: {
  name: string;
  public?: boolean;
}): Promise<{ id: string; name: string }> {
  return createPlaylistSvc(args);
}

export async function spotifyReplacePlaylistTracks(
  playlistId: string,
  trackIds: string[],
): Promise<void> {
  return replacePlaylistTracksSvc(playlistId, trackIds);
}
