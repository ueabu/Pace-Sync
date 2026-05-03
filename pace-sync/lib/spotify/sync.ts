import "server-only";

import type {
  CreatePlaylistInput,
  CreatePlaylistResult,
  ReplacePlaylistTracksInput,
  ReplacePlaylistTracksResult,
} from "@/lib/spotify/types";

// TODO(sync-workstream): Implement with Spotify Web API (create user playlist + add tracks in batches).

export async function createPlaylist(
  _input: CreatePlaylistInput,
): Promise<CreatePlaylistResult> {
  void _input;
  throw new Error("createPlaylist is not implemented yet");
}

// TODO(sync-workstream): PUT https://api.spotify.com/v1/playlists/{playlist_id}/tracks

export async function replacePlaylistTracks(
  _input: ReplacePlaylistTracksInput,
): Promise<ReplacePlaylistTracksResult> {
  void _input;
  throw new Error("replacePlaylistTracks is not implemented yet");
}
