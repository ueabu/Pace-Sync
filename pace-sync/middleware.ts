import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth/cookies";
import { SPOTIFY_SESSION_COOKIE } from "@/lib/spotify/cookie-names";

export function middleware(request: NextRequest) {
  const hasSpotifySession = request.cookies.get(SPOTIFY_SESSION_COOKIE)?.value;
  const hasLegacySession = request.cookies.get(SESSION_COOKIE)?.value;
  const isAuthed = Boolean(hasSpotifySession || hasLegacySession);

  const { pathname } = request.nextUrl;

  if (
    !isAuthed &&
    (pathname.startsWith("/playlists") || pathname.startsWith("/timeline"))
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/playlists", "/playlists/:path*", "/timeline", "/timeline/:path*"],
};
