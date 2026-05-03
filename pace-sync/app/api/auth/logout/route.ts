import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SPOTIFY_ACCESS_TOKEN_COOKIE,
} from "@/lib/auth/cookies";

export async function POST(request: Request) {
  const res = NextResponse.redirect(new URL("/", request.url));
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(SPOTIFY_ACCESS_TOKEN_COOKIE);
  return res;
}
