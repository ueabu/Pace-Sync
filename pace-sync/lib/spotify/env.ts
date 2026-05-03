import "server-only";

export type SpotifyRuntimeEnv = {
  clientId: string;
  redirectUri: string;
  sessionSecret: string;
};

function requireEnv(key: keyof NodeJS.ProcessEnv): string | undefined {
  const v = process.env[key];
  return v && String(v).length > 0 ? String(v) : undefined;
}

/** Validates Spotify-related env vars. Call from OAuth routes / session helpers only. */
export function getSpotifyEnv(): SpotifyRuntimeEnv {
  const clientId = requireEnv("SPOTIFY_CLIENT_ID");
  const redirectUri = requireEnv("SPOTIFY_REDIRECT_URI");
  const sessionSecret =
    requireEnv("SPOTIFY_SESSION_SECRET") ?? requireEnv("SESSION_SECRET");
  const missing: string[] = [];
  if (!clientId) missing.push("SPOTIFY_CLIENT_ID");
  if (!redirectUri) missing.push("SPOTIFY_REDIRECT_URI");
  if (!sessionSecret) missing.push("SPOTIFY_SESSION_SECRET or SESSION_SECRET");
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
  return {
    clientId: clientId!,
    redirectUri: redirectUri!,
    sessionSecret: sessionSecret!,
  };
}
