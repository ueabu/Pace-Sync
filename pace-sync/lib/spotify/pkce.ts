import { randomBytes, createHash, timingSafeEqual } from "node:crypto";

function base64UrlEncode(buffer: Uint8Array | Buffer): string {
  const b64 = Buffer.from(buffer).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** RFC 7636 verifier: cryptographically random, 43–128 chars URL-safe without padding issues. */
export function generateCodeVerifier(): string {
  return base64UrlEncode(randomBytes(32));
}

export function deriveCodeChallenge(verifier: string): string {
  const hash = createHash("sha256").update(verifier).digest();
  return base64UrlEncode(hash);
}

export function generateOAuthState(): string {
  return base64UrlEncode(randomBytes(32));
}

export function safeCompareState(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
