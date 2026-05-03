# Spec 005 — Course profile and elevation (Pacelist)

## Summary

Pacelist optionally overlays a race course elevation profile alongside the timeline. Users who never upload GPX or search for a course use the app unchanged; no shared playlist or timeline code may require a profile.

## Types (`lib/types.ts`)

- **`CourseProfilePoint`**: `{ distanceM: number; elevationM: number }` — cumulative horizontal distance along the course and elevation AMSL or as given in GPX.

- **`CourseProfile`**: `{ points: CourseProfilePoint[]; totalDistanceM: number; totalAscentM?: number }` — `totalAscentM` optional (positive-only vertical gain approximation for UI hints).

Parsing normalizes irregular GPX spacing into a monotone distance series and clamps bad values where reasonable.

## Parsing (`lib/course/`)

- **`parseGpx(xml: string): CourseProfile`** — validates root `<gpx>`, extracts track points (`trkpt` preferred, fallback `rtept`), reads `lon`/`lat`/`ele`; computes segment length with haversine; cumulative `distanceM`; elevation from `<ele>` or `0` if missing.

- **`validateGpx(xml: string): { ok: boolean; error?: string }`** — lightweight structural checks before parse.

Optional helpers: downsampling for very large traces (max points cap) while preserving endpoints.

No Supabase writes; parsing runs client-side in the demo (FileReader).

## Persistence bridge (`lib/course/coursePersistence.ts`)

- **`getCourseProfileForPersistence(profile: CourseProfile | null): string | null`** — JSON-stringify for another workstream to store.

- **`parseCourseProfileFromPersistence(json: string | null): CourseProfile | null`** — safe revive.

These are typed boundaries only; callers own storage.

## UI components (`components/course/`)

- **`CourseProfileContext`** — React context: `{ profile: CourseProfile | null; setProfile: … }`. Timeline owner passes width; consumers read profile without importing timeline internals.

- **`GpxUpload`** — hidden file input, `accept=".gpx"`, validates, parses, calls `setProfile` or sets local error state. Accessible label and Tailwind styling.

- **`ElevationChart`** — props: `profile: CourseProfile`, `racePlan: RacePlanLike` (`distanceM`, `targetSeconds`), optional `songBlocks`. Renders SVG polyline/path in a responsive container (`width: 100%`, height `h-28` sm:h-36). X-axis spans **race distance**: `songBlock.distanceMStart` / timeline position maps to `(distanceM / totalRaceM) * chartWidth`.

- **`RaceCourseSearch`** — text input + search; tries public APIs with short timeouts; on failure or empty shows “Course not found” and emphasizes GPX upload. No scraping.

### Alignment contract

Both timeline and chart use **the same fractional position** along total race distance: `fraction = clamp(distanceM / raceDistanceM, 0, 1)`. Parent supplies full width wrapper; timeline workstream renders above/below chart using the same `racePlan.distanceM` as denominator.

### Visual emphasis

Elevation path uses contrasting stroke/fill (area under curve), grid hints for km or miles labels where space allows, responsive shorter height on narrow viewports while width stays aligned.

## Demo integration (`app/page.tsx`)

Standalone demo: mock `songBlocks`, placeholder “timeline” bar with blocks, `CourseProvider` wrapping upload + chart + placeholder race distance/time controls. Demonstrates horizontal alignment without editing non-existent timeline files.

## Dependencies

Prefer zero new chart libs; SVG + Tailwind only.

## Acceptance

1. `.gpx` upload validates invalid XML and clears errors on success.
2. Chart shows plausible elevation; hills readable (scaling min/max elevation with padding).
3. Removing profile hides chart; playlist flow unaffected in demo (`profile === null`).
4. Race search never blocks upload; failures show GPX CTA.

## Repo layout

The Next.js app lives in `pace-sync/`. Types and components use the `@/` alias, which resolves to that package root.
