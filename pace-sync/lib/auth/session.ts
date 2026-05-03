import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SPOTIFY_ACCESS_TOKEN_COOKIE,
} from "@/lib/auth/cookies";

export type AppSession =
  | { status: "guest" }
  | { status: "authed"; accessToken: string | null };

export async function getSession(): Promise<AppSession> {
  const jar = await cookies();
  const session = jar.get(SESSION_COOKIE)?.value;
  if (!session) return { status: "guest" };
  const accessToken = jar.get(SPOTIFY_ACCESS_TOKEN_COOKIE)?.value ?? null;
  return { status: "authed", accessToken };
}

export function isAuthed(session: AppSession): boolean {
  return session.status === "authed";
}
