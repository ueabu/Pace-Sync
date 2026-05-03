/** App-shell playlist row shape (from Spotify Web API). */
export type SpotifyPlaylistSummary = {
  id: string;
  name: string;
  coverUrl: string | null;
  trackCount: number;
};

/** Server action → `lib/spotify/sync` (cookie-based session; `accessToken` reserved). */
export type CreatePlaylistInput = {
  accessToken?: string;
  name: string;
  /** `spotify:track:` URIs in playback order */
  trackUris: string[];
};

export type CreatePlaylistResult = {
  playlistId: string;
  /** Web URL for the playlist */
  spotifyUrl: string;
};

export type ReplacePlaylistTracksInput = {
  accessToken?: string;
  playlistId: string;
  trackUris: string[];
};

export type ReplacePlaylistTracksResult = {
  spotifyUrl: string;
};

export type SpotifySearchTrack = {
  id: string;
  name: string;
  artists: string[];
  durationMs: number;
  uri?: string;
};
