import { NextResponse } from "next/server";

/**
 * Entry point for Spotify OAuth (Authorization Code + PKCE).
 * The auth workstream should set `SPOTIFY_OAUTH_START_URL` to the app's PKCE start URL,
 * or replace this handler to perform the redirect inline.
 */
export async function GET(request: Request) {
  const target = process.env.SPOTIFY_OAUTH_START_URL;
  if (target) {
    const url =
      target.startsWith("http://") || target.startsWith("https://")
        ? target
        : new URL(target, request.url).toString();
    return NextResponse.redirect(url);
  }
  return NextResponse.json(
    { error: "OAuth is not configured (missing SPOTIFY_OAUTH_START_URL)." },
    { status: 503 },
  );
}
