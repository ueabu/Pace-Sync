import { cookies } from "next/headers";

import {
  SESSION_COOKIE,
  SPOTIFY_ACCESS_TOKEN_COOKIE,
} from "@/lib/auth/cookies";
import {
  ensureAccessToken,
  readSpotifySessionCookie,
} from "@/lib/spotify/session-cookie";

export type AppSession =
  | { status: "guest" }
  | { status: "authed"; accessToken: string | null };

export async function getSession(): Promise<AppSession> {
  const spotify = await readSpotifySessionCookie();
  if (spotify) {
    try {
      const accessToken = await ensureAccessToken();
      return { status: "authed", accessToken };
    } catch {
      return { status: "guest" };
    }
  }

  const jar = await cookies();
  const legacy = jar.get(SESSION_COOKIE)?.value;
  if (legacy) {
    const accessToken = jar.get(SPOTIFY_ACCESS_TOKEN_COOKIE)?.value ?? null;
    return { status: "authed", accessToken };
  }

  return { status: "guest" };
}

export function isAuthed(session: AppSession): boolean {
  return session.status === "authed";
}
