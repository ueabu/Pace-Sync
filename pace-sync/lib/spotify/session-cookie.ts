import "server-only";

import {
  hkdfSync,
  randomBytes,
  createCipheriv,
  createDecipheriv,
} from "node:crypto";

import { cookies } from "next/headers";

import { SPOTIFY_SESSION_COOKIE } from "./cookie-names";
import { getSpotifyEnv } from "./env";
import { refreshAccessTokens } from "./oauth-accounts";

export {
  SPOTIFY_OAUTH_PENDING_COOKIE,
  SPOTIFY_SESSION_COOKIE,
} from "./cookie-names";

const SEAL_VERSION = 1;

export type PendingOAuthCookie = {
  state: string;
  codeVerifier: string;
};

export type SpotifySessionPayload = {
  accessToken: string;
  refreshToken: string;
  expiresAtMs: number;
};

const IS_PRODUCTION = process.env.NODE_ENV === "production";

function cookieAttrs(maxAgeSeconds: number) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: IS_PRODUCTION,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/** Pending OAuth (~10 minutes). */
export const SPOTIFY_PENDING_MAX_AGE = 600;

/** Persisted Spotify session (~1 year, refreshed periodically). */
export const SPOTIFY_SESSION_MAX_AGE = 60 * 60 * 24 * 365;

function deriveKey(secret: string, salt: Buffer): Buffer {
  return Buffer.from(
    hkdfSync("sha256", secret, salt, "pacelist-spotify_cookie_v1", 32),
  );
}

function sealPayload(plaintext: string, secret: string): string {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = deriveKey(secret, salt);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([
    Buffer.from([SEAL_VERSION]),
    salt,
    iv,
    ciphertext,
    tag,
  ]).toString("base64url");
}

function unsealPayload(payload: string, secret: string): string | null {
  try {
    const buf = Buffer.from(payload, "base64url");
    if (buf.length < 1 + 16 + 12 + 16 || buf.readUInt8(0) !== SEAL_VERSION) {
      return null;
    }
    const salt = buf.subarray(1, 17);
    const iv = buf.subarray(17, 29);
    const tag = buf.subarray(buf.length - 16);
    const enc = buf.subarray(29, buf.length - 16);
    const key = deriveKey(secret, salt);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString(
      "utf8",
    );
  } catch {
    return null;
  }
}

export function serializePendingOAuth(data: PendingOAuthCookie, secret: string) {
  return sealPayload(JSON.stringify(data), secret);
}

export function parsePendingOAuth(
  sealed: string,
  secret: string,
): PendingOAuthCookie | null {
  const raw = unsealPayload(sealed, secret);
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as PendingOAuthCookie;
    if (
      typeof v?.state !== "string" ||
      typeof v?.codeVerifier !== "string"
    ) {
      return null;
    }
    return v;
  } catch {
    return null;
  }
}

export function serializeSpotifySession(
  data: SpotifySessionPayload,
  secret: string,
) {
  return sealPayload(JSON.stringify(data), secret);
}

export function parseSpotifySession(
  sealed: string,
  secret: string,
): SpotifySessionPayload | null {
  const raw = unsealPayload(sealed, secret);
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as SpotifySessionPayload;
    if (
      typeof v?.accessToken !== "string" ||
      typeof v?.refreshToken !== "string" ||
      typeof v?.expiresAtMs !== "number"
    ) {
      return null;
    }
    return v;
  } catch {
    return null;
  }
}

export function cookieOptionsPending() {
  return cookieAttrs(SPOTIFY_PENDING_MAX_AGE);
}

export function cookieOptionsSession() {
  return cookieAttrs(SPOTIFY_SESSION_MAX_AGE);
}

/** Read decrypted Spotify session from cookies (no refresh). */
export async function readSpotifySessionCookie(): Promise<SpotifySessionPayload | null> {
  const jar = await cookies();
  const raw = jar.get(SPOTIFY_SESSION_COOKIE)?.value;
  if (!raw) return null;
  let sessionSecret: string;
  try {
    sessionSecret = getSpotifyEnv().sessionSecret;
  } catch {
    return null;
  }
  return parseSpotifySession(raw, sessionSecret);
}

/**
 * Ensures access token is valid for Web API calls; refreshes and persists cookie when near expiry.
 */
export async function ensureAccessToken(): Promise<string> {
  const env = getSpotifyEnv();
  let session = await readSpotifySessionCookie();
  if (!session) {
    throw new Error(
      "Not connected to Spotify. Visit /api/auth/spotify to authorize.",
    );
  }

  const skewMs = 60_000;
  if (session.expiresAtMs - skewMs > Date.now()) {
    return session.accessToken;
  }

  const refreshed = await refreshAccessTokens({
    refreshToken: session.refreshToken,
    clientId: env.clientId,
  });

  session = {
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken,
    expiresAtMs: refreshed.expiresAtMs,
  };

  const jar = await cookies();
  jar.set(
    SPOTIFY_SESSION_COOKIE,
    serializeSpotifySession(session, env.sessionSecret),
    cookieOptionsSession(),
  );

  return session.accessToken;
}
