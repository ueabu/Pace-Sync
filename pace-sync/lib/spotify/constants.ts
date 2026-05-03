export const SPOTIFY_AUTH_ACCOUNTS = "https://accounts.spotify.com";
export const SPOTIFY_API_BASE = "https://api.spotify.com";

/** Path for kicking off Spotify OAuth from the Next app (use with HTTPS dev server). */
export const SPOTIFY_AUTH_PATH = "/api/auth/spotify" as const;

export const SPOTIFY_SCOPES = [
  "playlist-read-private",
  "playlist-modify-public",
  "playlist-modify-private",
  "user-read-private",
  "user-read-email",
].join(" ");
