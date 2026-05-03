# Spec 004: App shell and sync flow (Pacelist)

## Goal

Ship the global app shell, post-auth navigation, playlist picker, and Spotify sync UX. The timeline canvas stays owned by another workstream; this spec only wraps it with routing, auth gates, and sync.

## User flows

### Landing (`/`)

- Short headline and one sentence explaining that Pacelist maps a Spotify playlist to race pace.
- Primary action: **Connect Spotify** → starts OAuth (see Auth integration).
- Unauthenticated users see a direct, runner-focused page (minimal, typographic; no corporate chrome).

### Playlist picker (`/playlists`)

- After authentication, user sees their Spotify playlists as a list or grid.
- Each row/card shows **name**, **cover image**, and **track count**.
- Choosing a playlist navigates to the timeline editor with that playlist context in the URL (see Navigation contract).

### Timeline (`/timeline`)

- Route exists for the editor workstream. This delivery provides only a thin shell: page framing and **Sync to Spotify** entry point.
- No canvas implementation here.

### Sync modal

- Opened from the timeline shell (e.g. button in the header area).
- Modes:
  1. **New playlist**: user enters a name; on confirm, create playlist and add tracks in the current arrangement order.
  2. **Replace source playlist**: replace all tracks in the playlist the user imported from with the new arrangement.
- Modal shows a **preview sentence** before confirm (e.g. “This will replace 23 tracks in ‘Marathon Mix’ with your new arrangement” or “This will create a new playlist named ‘…’ with 23 tracks”).
- On success: toast or inline success and a **link to open the playlist in Spotify** (`open.spotify.com/playlist/{id}`).

## Auth and session

### Server-side session

- Layout or route components read session via `lib/auth/session.ts` (`getSession()` or equivalent).
- **Protected routes**: `/playlists`, `/timeline`. If the user is not authenticated, **redirect to `/`**.

Implementation note: middleware may enforce redirects; session shape should remain the single source of truth for “logged in” for UI (e.g. header logout visibility).

### OAuth start URL

- **Connect Spotify** links to the route owned by the auth/OAuth workstream. This spec uses:

  **`GET /api/auth/spotify/start`**

- That handler should redirect to Spotify (or the app’s PKCE start). Until wired, a stub may set dev cookies only if explicitly agreed; production behavior is redirect-only.

### Logout

- **`POST /api/auth/logout`** (or `GET` if the other stream standardizes on GET) clears session cookies and returns or redirects to `/`.

Cookie names and HTTP-only flags must match what the OAuth callback sets. This implementation expects:

- `pacelist_session` — presence indicates a logged-in app session (middleware + UI).
- `pacelist_spotify_access_token` — Spotify access token for `lib/spotify` server calls.

Document any changes in `PROJECT.md` when integrating. **`SPOTIFY_OAUTH_START_URL`** (optional) on `/api/auth/spotify/start` should point at the PKCE start URL until the handler is inlined.

## Spotify integration

- **All Spotify HTTP and token usage** go through `lib/spotify/`. App routes and components must not call `fetch('https://api.spotify.com/...')` directly.
- **`createPlaylist`** and **`replacePlaylistTracks`** are owned by another workstream. If absent, implementations use **typed stubs** and `// TODO` until merged.

Helpers expected in this area include (names may vary slightly):

- Listing current user’s playlists (for `/playlists`).
- Creating a playlist with a name and adding ordered track URIs.
- Replacing tracks in an existing playlist.

## Navigation contract (playlist → timeline)

When a user selects a playlist on `/playlists`, navigate to:

```text
/timeline?sourcePlaylistId={id}&sourcePlaylistName={encodedName}&trackCount={n}
```

- `sourcePlaylistName` should be URL-encoded.
- `trackCount` is used for sync preview until the editor workstream exposes live arrangement state.
- The timeline workstream may later replace query params with persisted plan IDs; the shell should keep working with query params until then.

## Visual and UI system

- **Stack**: Next.js App Router, TypeScript, Tailwind (mobile first).
- **Components**: shadcn/ui-style primitives where they reduce boilerplate—**Button**, **Dialog** (modal), **Input**, **Label**, and **toast** (e.g. Sonner).
- **Look**: Near-black text on light background; **one accent** for primary actions. Typography-led hierarchy; runner-centric, functional copy on the landing page.
- **Responsive**: Header, playlist list, and modal usable at phone widths.

## Non-goals (this spec)

- Timeline canvas, drag-and-drop, anchors, or race inputs.
- Persisted race plans beyond URL/query placeholders.
- Direct Spotify API calls outside `lib/spotify/`.

## Acceptance checklist

- [ ] `/` explains the product and starts OAuth via `/api/auth/spotify/start`.
- [ ] `/playlists` lists playlists (name, cover, count) using `lib/spotify` only.
- [ ] Unauthenticated access to `/playlists` or `/timeline` redirects to `/`.
- [ ] Global header: logo/home, logout when authenticated; layout consistent and mobile-friendly.
- [ ] `/timeline` exposes sync entry point and modal with create vs replace, preview, confirm, success + Spotify link.
- [ ] `createPlaylist` / `replacePlaylistTracks` are real or clearly stubbed with types and TODOs.
