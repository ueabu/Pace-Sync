import { NextResponse } from "next/server";

import { SPOTIFY_AUTH_PATH } from "@/lib/spotify/constants";

/** Legacy entry alias: PKCE flow lives at `/api/auth/spotify`. */
export function GET(request: Request) {
  return NextResponse.redirect(new URL(SPOTIFY_AUTH_PATH, request.url));
}
