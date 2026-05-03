# Spec 003: Timeline editor (Pacelist)

## Purpose

The timeline editor is the primary canvas where users arrange playlist tracks against a race plan. It visualizes when each song starts relative to distance and elapsed race time, supports reordering and anchor pins, and allows adding tracks via Spotify search.

## Route and file layout

- **Route:** `app/timeline/page.tsx` (Next.js App Router).
- **UI components:** `components/timeline/*`.
- **Arrangement logic:** `lib/arrangement/` (consumed by the editor; not reimplemented in UI).
- **Spotify search:** `lib/spotify/` plus `app/api/spotify/search/route.ts` so the browser never holds client credentials.

## User-facing behavior

### Race details bar

- Fixed at the top of the canvas context: **distance** (numeric) and **target finish time** (hours, minutes, seconds), editable inline.
- **Unit:** kilometer vs mile for distance readouts and axis markers; changing distance or time recomputes pace and updates the **time axis** and **block layout** immediately.
- Values drive `raceDurationSeconds` and distance for marker math.

### Timeline canvas

- Each **track** is a horizontal block whose width is proportional to `track.duration / raceDuration` (clamped sensibly when audio exceeds the race window).
- Blocks are **ordered** by the user’s playlist order (working arrangement).
- Each block shows **title** (truncated), **pinned** styling when anchored, and **start time** readout (see below).

### Time axis

- Horizontal scale for **elapsed race time** (minute ticks by default, adaptive for very short races).
- **Distance markers** (km or mi) derived from average pace: `distanceAtTime(t) = (t / targetTime) * totalDistance`.
- On **narrow viewports**, the canvas lives in a **horizontal scroll** region; the axis remains legible (adequate tick spacing, optional smaller type).

### Drag and drop

- **Reorder** tracks vertically (list) or in the track lane using **@dnd-kit** with **pointer and touch** sensors suitable for mobile.
- **Drag handles** meet minimum touch target size (approximately 44×44 CSS px).

### Anchor pins

- **Pin:** User pins a track to a **specific elapsed time** in the race (`anchorSeconds`).
- **Visual:** Pinned tracks use distinct border/background/icon treatment.
- **Reorder:** Changing order does **not** clear anchors; the arrangement engine is responsible for reconciling order and anchors (UI passes anchors into the engine).

### Search and add

- Search field debounced; results from **Spotify** via **server API** that calls `lib/spotify` helpers (no direct Spotify calls from React components).
- User can **add** a result to the working track list (append or insert—implementation may append for simplicity).

### Start time readout

- For each track, show **`start` as mm:ss or h:mm:ss** from the arrangement output so users see when each song begins in the race.

## State and persistence

- **React state** (and/or context local to this flow) holds the **working arrangement**: ordered tracks, race fields, anchors.
- **No Supabase writes** in these components. Expose a **typed context** (or callback props) with `tracks`, `racePlan`, `arrangement`, and setters so a persistence layer can subscribe or hydrate later.

## Arrangement engine contract

- UI calls **`computeArrangement`** from `lib/arrangement` with typed inputs (ordered tracks with `durationMs` and optional `anchorSeconds`, plus race duration).
- If the full engine is not wired, a **stub** returns **evenly spaced** start times for non-anchored tracks and **must** include a **TODO** referencing future integration.
- **Do not** duplicate placement algorithms in `components/timeline/`.

## Spotify contract

- Components use **`lib/spotify`** for search behavior **indirectly** (e.g. `fetch('/api/spotify/search?...')` backed by helpers).
- Helpers accept query string; errors and empty results are handled gracefully in the UI.

## Responsiveness

- **Mobile first** Tailwind; timeline **scrolls horizontally** when content is wider than the viewport.
- Dark mode follows existing `prefers-color-scheme` tokens where applicable.

## Non-goals (this spec)

- Persisting to the database or syncing back to Spotify.
- GPX/elevation.
- BPM or cadence matching.
