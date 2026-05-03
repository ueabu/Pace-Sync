import "server-only";

import { SPOTIFY_AUTH_ACCOUNTS } from "./constants";

export type TokensFromAccounts = {
  accessToken: string;
  refreshToken: string;
  expiresAtMs: number;
};

type TokenResponseRaw = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

function formBody(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}

export async function exchangeAuthorizationCode(args: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
  clientId: string;
}): Promise<TokensFromAccounts> {
  const res = await fetch(`${SPOTIFY_AUTH_ACCOUNTS}/api/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formBody({
      grant_type: "authorization_code",
      code: args.code,
      redirect_uri: args.redirectUri,
      client_id: args.clientId,
      code_verifier: args.codeVerifier,
    }),
  });

  const data = (await res.json()) as TokenResponseRaw;
  if (
    !res.ok ||
    !data.access_token ||
    data.expires_in === undefined ||
    !data.refresh_token
  ) {
    const detail = data.error_description ?? data.error ?? res.statusText;
    throw new Error(`Spotify token exchange failed: ${detail}`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAtMs: Date.now() + data.expires_in * 1000,
  };
}

export async function refreshAccessTokens(args: {
  refreshToken: string;
  clientId: string;
}): Promise<TokensFromAccounts> {
  const res = await fetch(`${SPOTIFY_AUTH_ACCOUNTS}/api/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formBody({
      grant_type: "refresh_token",
      refresh_token: args.refreshToken,
      client_id: args.clientId,
    }),
  });

  const data = (await res.json()) as TokenResponseRaw & {
    refresh_token?: string;
  };
  if (!res.ok || !data.access_token || data.expires_in === undefined) {
    const detail = data.error_description ?? data.error ?? res.statusText;
    throw new Error(`Spotify refresh failed: ${detail}`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? args.refreshToken,
    expiresAtMs: Date.now() + data.expires_in * 1000,
  };
}
