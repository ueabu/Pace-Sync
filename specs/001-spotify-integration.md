# Spec 001 — Spotify integration (Pacelist / pace-sync)

## Overview

Pacelist integrates with Spotify using **Authorization Code with PKCE**. Tokens live in **`httpOnly` cookies sealed with AES-256-GCM** (random salt + HKDF-derived key per payload). Application code consumes typed helpers and server actions; **no Spotify UI** is defined here.

References: [Spotify PKCE flow](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow), [Web API concepts](https://developer.spotify.com/documentation/web-api/concepts/authorization).

## OAuth (PKCE)

### Authorize

`GET https://accounts.spotify.com/authorize` with:

| Parameter | Value |
|-----------|--------|
| `response_type` | `code` |
| `client_id` | `SPOTIFY_CLIENT_ID` |
| `redirect_uri` | `SPOTIFY_REDIRECT_URI` (must match dashboard allowlist **exactly**) |
| `scope` | Space-separated scopes (see below) |
| `state` | Random CSRF token |
| `code_challenge_method` | `S256` |
| `code_challenge` | Base64url(SHA-256(code_verifier)) |

### Token exchange (callback)

`POST https://accounts.spotify.com/api/token` with `Content-Type: application/x-www-form-urlencoded`:

- `grant_type=authorization_code`
- `code` (from callback query)
- `redirect_uri` (same as authorize step)
- `client_id`
- `code_verifier` (from pending cookie)

**No `client_secret`** when the authorize request included PKCE parameters; otherwise Spotify may treat the flow as confidential-only and expect a secret.

### Refresh

`POST` to the same token URL with:

- `grant_type=refresh_token`
- `refresh_token`
- `client_id`

Again **no client secret** for tokens issued via PKCE.

## Scopes

Minimum for current helpers:

- `playlist-read-private` — list user playlists
- `playlist-modify-public` — create / replace on public playlists
- `playlist-modify-private` — create / replace on private playlists
- `user-read-private` — resolve current user for `GET /v1/me` (create playlist)

Optional: `user-read-email`.

## Cookie contract

All auth cookies: **`httpOnly`**, **`Path=/`**, **`SameSite=Lax`**, **`Secure` in production**.

| Name | Purpose | Lifetime |
|------|---------|----------|
| Pending OAuth | Sealed JSON `{ state, codeVerifier }` for CSRF + PKCE | ~10 minutes |
| Session | Sealed JSON `{ accessToken, refreshToken, expiresAtMs }` | ~1 year sliding on refresh |

Values are **not** readable by client JavaScript. **Rotating `SPOTIFY_SESSION_SECRET` (or `SESSION_SECRET`) invalidates all sessions** with no migration in v1.

## Rate limits (429)

All Spotify Web API calls go through a single wrapper that:

1. Reads optional `Retry-After` (seconds).
2. Waits up to that value, capped (e.g. 60s).
3. Retries up to a small bound (e.g. 3 attempts).

## Domain mapping

`Track` (see `lib/types.ts`):

- `id` — Spotify track id
- `name`
- `artists` — array of artist display names
- `durationMs` — `duration_ms` from API

Playlist track items with `track: null` (local / removed) are skipped. `PlaylistSummary` is used for list endpoints (id, name, optional image / counts).

## Public integration surface (for other workstreams)

- **Start OAuth**: `GET /api/auth/spotify` → redirect to Spotify.
- **Callback**: `GET /api/auth/spotify/callback` → sets session cookie, redirects to `/` with query flags for success/error.
- **Constant**: `SPOTIFY_AUTH_PATH` (or equivalent) for building links.
- **Server actions** in `actions/spotify-data.ts`: thin wrappers around `lib/spotify` helpers (playlists, search, create, replace).

Helpers **do not** take raw tokens from callers; they read the session cookie and refresh when needed.

## Environment variables

Documented in `pace-sync/.env.local.example`:

| Variable | Description |
|----------|-------------|
| `SPOTIFY_CLIENT_ID` | Spotify app client id |
| `SPOTIFY_REDIRECT_URI` | e.g. `https://localhost:3000/api/auth/spotify/callback` for HTTPS dev |
| `SPOTIFY_SESSION_SECRET` | Long random string for cookie sealing (preferred) |
| `SESSION_SECRET` | Accepted **alias** for the same secret if present |

## Local development

- Run with **`bun run dev`** using Next **experimental HTTPS** so the redirect URI can use `https://localhost:3000`.
- Register the **same** redirect URI in the Spotify Developer Dashboard (scheme, host, port, path, trailing slash).

## Helper → endpoint map

| Helper | Method | Path |
|--------|--------|------|
| `getUserPlaylists` | GET | `/v1/me/playlists` (paginate) |
| `getPlaylistTracks` | GET | `/v1/playlists/{id}/tracks` (paginate) |
| `searchTracks` | GET | `/v1/search` `type=track` |
| `createPlaylist` | GET + POST | `/v1/me` then `/v1/users/{user_id}/playlists` |
| `replacePlaylistTracks` | PUT | `/v1/playlists/{id}/tracks` (chunk URIs ≤ 100) |
