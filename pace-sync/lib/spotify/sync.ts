import "server-only";

import type {
  CreatePlaylistInput,
  CreatePlaylistResult,
  ReplacePlaylistTracksInput,
  ReplacePlaylistTracksResult,
} from "@/lib/spotify/types";

import {
  createPlaylist as spotifyCreateUserPlaylist,
  replacePlaylistTracks as spotifyReplacePlaylistTracks,
} from "./playlists";

function urisToTrackIds(uris: string[]): string[] {
  return uris.map((u) =>
    u.startsWith("spotify:track:") ? u.slice("spotify:track:".length) : u,
  );
}

/** Create a new playlist and write the ordered track URIs via the Web API (cookie session). */
export async function createPlaylist(
  input: CreatePlaylistInput,
): Promise<CreatePlaylistResult> {
  void input.accessToken;
  const { id } = await spotifyCreateUserPlaylist({ name: input.name });
  const ids = urisToTrackIds(input.trackUris);
  await spotifyReplacePlaylistTracks(id, ids);
  return {
    playlistId: id,
    spotifyUrl: `https://open.spotify.com/playlist/${id}`,
  };
}

/** Replace tracks in an existing playlist (cookie session). */
export async function replacePlaylistTracks(
  input: ReplacePlaylistTracksInput,
): Promise<ReplacePlaylistTracksResult> {
  void input.accessToken;
  const ids = urisToTrackIds(input.trackUris);
  await spotifyReplacePlaylistTracks(input.playlistId, ids);
  return {
    spotifyUrl: `https://open.spotify.com/playlist/${input.playlistId}`,
  };
}
