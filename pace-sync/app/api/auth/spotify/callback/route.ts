import { NextRequest, NextResponse } from "next/server";

import { getSpotifyEnv } from "@/lib/spotify/env";
import { exchangeAuthorizationCode } from "@/lib/spotify/oauth-accounts";
import { safeCompareState } from "@/lib/spotify/pkce";
import {
  cookieOptionsPending,
  cookieOptionsSession,
  parsePendingOAuth,
  serializeSpotifySession,
  SPOTIFY_OAUTH_PENDING_COOKIE,
  SPOTIFY_SESSION_COOKIE,
} from "@/lib/spotify/session-cookie";

function redirectHome(request: NextRequest, search: Record<string, string>) {
  const dest = request.nextUrl.clone();
  dest.pathname = "/";
  dest.search = "";
  for (const [k, v] of Object.entries(search)) {
    dest.searchParams.set(k, v);
  }
  return NextResponse.redirect(dest);
}

function wipePendingCookie(res: NextResponse) {
  res.cookies.set(SPOTIFY_OAUTH_PENDING_COOKIE, "", {
    ...cookieOptionsPending(),
    maxAge: 0,
  });
}

/** OAuth callback: validates state, exchanges code, sets Spotify session cookie. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const err = params.get("error");

  if (err === "access_denied") {
    const res = redirectHome(request, { spotify_error: "access_denied" });
    wipePendingCookie(res);
    return res;
  }
  if (err) {
    const res = redirectHome(request, { spotify_error: err });
    wipePendingCookie(res);
    return res;
  }

  const code = params.get("code");
  const state = params.get("state");

  let env: ReturnType<typeof getSpotifyEnv>;
  try {
    env = getSpotifyEnv();
  } catch {
    return redirectHome(request, { spotify_error: "config" });
  }

  const sealed = request.cookies.get(SPOTIFY_OAUTH_PENDING_COOKIE)?.value;
  if (!code || !state || !sealed) {
    const res = redirectHome(request, { spotify_error: "invalid_callback" });
    wipePendingCookie(res);
    return res;
  }

  const pending = parsePendingOAuth(sealed, env.sessionSecret);
  if (!pending || !safeCompareState(state, pending.state)) {
    const res = redirectHome(request, { spotify_error: "csrf" });
    wipePendingCookie(res);
    return res;
  }

  try {
    const tokens = await exchangeAuthorizationCode({
      code,
      redirectUri: env.redirectUri,
      clientId: env.clientId,
      codeVerifier: pending.codeVerifier,
    });

    const res = redirectHome(request, { spotify_connected: "1" });
    wipePendingCookie(res);

    const sessionPayload = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAtMs: tokens.expiresAtMs,
    };
    res.cookies.set(
      SPOTIFY_SESSION_COOKIE,
      serializeSpotifySession(sessionPayload, env.sessionSecret),
      cookieOptionsSession(),
    );

    return res;
  } catch {
    const res = redirectHome(request, { spotify_error: "token_exchange" });
    wipePendingCookie(res);
    return res;
  }
}
