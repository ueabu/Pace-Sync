import "server-only";

export type { Track, PlaylistSummary } from "@/lib/types";

export type {
  SpotifyPlaylistSummary,
  CreatePlaylistInput,
  CreatePlaylistResult,
  ReplacePlaylistTracksInput,
  ReplacePlaylistTracksResult,
  SpotifySearchTrack,
} from "./types";

export { SPOTIFY_AUTH_PATH, SPOTIFY_SCOPES } from "./constants";

export {
  SPOTIFY_OAUTH_PENDING_COOKIE,
  SPOTIFY_SESSION_COOKIE,
  readSpotifySessionCookie,
  ensureAccessToken,
} from "./session-cookie";

export {
  getUserPlaylists,
  getPlaylistTracks,
  searchTracks,
  createPlaylist,
  replacePlaylistTracks,
  fetchUserPlaylists,
  fetchPlaylistTrackUris,
} from "./playlists";

export { spotifyFetch, spotifyFetchJson, SpotifyApiError } from "./http";
export { toTrack } from "./map-track";

export { searchSpotifyTracks } from "./search";
