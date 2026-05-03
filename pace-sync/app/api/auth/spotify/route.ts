import { NextResponse } from "next/server";

import { SPOTIFY_AUTH_ACCOUNTS, SPOTIFY_SCOPES } from "@/lib/spotify/constants";
import { getSpotifyEnv } from "@/lib/spotify/env";
import {
  deriveCodeChallenge,
  generateCodeVerifier,
  generateOAuthState,
} from "@/lib/spotify/pkce";
import {
  cookieOptionsPending,
  serializePendingOAuth,
  SPOTIFY_OAUTH_PENDING_COOKIE,
} from "@/lib/spotify/session-cookie";

/** Begin Spotify OAuth (Authorization Code + PKCE). Redirects to Spotify. */
export async function GET() {
  const env = getSpotifyEnv();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = deriveCodeChallenge(codeVerifier);
  const state = generateOAuthState();

  const authorize = new URL(`${SPOTIFY_AUTH_ACCOUNTS}/authorize`);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("client_id", env.clientId);
  authorize.searchParams.set("scope", SPOTIFY_SCOPES);
  authorize.searchParams.set("redirect_uri", env.redirectUri);
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("code_challenge_method", "S256");
  authorize.searchParams.set("code_challenge", codeChallenge);

  const res = NextResponse.redirect(authorize.toString());

  const pending = serializePendingOAuth(
    { state, codeVerifier },
    env.sessionSecret,
  );
  res.cookies.set(SPOTIFY_OAUTH_PENDING_COOKIE, pending, cookieOptionsPending());

  return res;
}
