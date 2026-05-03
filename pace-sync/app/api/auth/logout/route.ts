import { NextResponse } from "next/server";

import {
  SESSION_COOKIE,
  SPOTIFY_ACCESS_TOKEN_COOKIE,
} from "@/lib/auth/cookies";
import {
  SPOTIFY_OAUTH_PENDING_COOKIE,
  SPOTIFY_SESSION_COOKIE,
  cookieOptionsPending,
  cookieOptionsSession,
} from "@/lib/spotify/session-cookie";

export async function POST(request: Request) {
  const res = NextResponse.redirect(new URL("/", request.url));
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(SPOTIFY_ACCESS_TOKEN_COOKIE);
  res.cookies.set(SPOTIFY_SESSION_COOKIE, "", {
    ...cookieOptionsSession(),
    maxAge: 0,
  });
  res.cookies.set(SPOTIFY_OAUTH_PENDING_COOKIE, "", {
    ...cookieOptionsPending(),
    maxAge: 0,
  });
  return res;
}
