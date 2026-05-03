# Spec: Pace and arrangement engine

Pure deterministic TypeScript in [`lib/arrangement/`](../lib/arrangement/). No I/O, `fetch`, Supabase, or React. Domain types in [`lib/types.ts`](../lib/types.ts).

## Units

- **Distance**: meters (`RacePlan.distanceMeters`).
- **Race clock and arrangement**: seconds (`RacePlan.targetTimeSeconds`, all start times and durations in arrangement output).
- **Track duration in data**: milliseconds per [PROJECT.md](../PROJECT.md) (`Track.durationMs`). The engine uses `durationSecond = durationMs / 1000` for timeline math.

## Types

Source of truth: [`lib/types.ts`](../lib/types.ts).

| Type | Meaning |
|------|--------|
| `Track` | `id`, `name`, `artists`, `durationMs`. |
| `Anchor` | `trackId`, `targetSecond` — desired **start** time of that track on the race clock (playback begins at `targetSecond` when feasible). |
| `RacePlan` | `distanceMeters`, `targetTimeSeconds`, `anchors`, `orderedTrackIds` (playlist order; the engine does **not** reorder tracks). |
| `Arrangement` | `entries`: ordered `ArrangementEntry` matching `orderedTrackIds`, each with `trackId`, `startSecond`, `durationSecond`, and optional `anchorDeviationSeconds`. |
| `PlanValidationError` | Structured errors from `validatePlan` (see Error catalog). |

**Anchor deviation**: For an entry whose track has an anchor, `anchorDeviationSeconds = startSecond - targetSecond` (signed). Omitted when the track is not anchored. Zero when the anchor is satisfied exactly.

## Public API

Consumers MUST import only from [`lib/arrangement/index.ts`](../lib/arrangement/index.ts):

- `computePace(plan)`
- `computeArrangement(plan, tracks)`
- `validatePlan(plan, tracks)`

Do not import from `pace.ts`, `arrange.ts`, or `validate.ts` directly.

## `computePace(plan)`

Returns **seconds per kilometer**:

\[
\text{pace} = \frac{\text{targetTimeSeconds}}{\text{distanceMeters} / 1000}
\]

**Edge case**: If `distanceMeters <= 0`, return `Infinity` (no well-defined pace per km).

## `computeArrangement(plan, tracks)`

### Inputs

- Build a map `trackId → durationSecond` from `tracks` (must contain every id in `orderedTrackIds` for a well-defined layout; missing ids are a validation concern — see `validatePlan`).

### Algorithm (forward, deterministic, fixed order)

Let `orderedTrackIds[i]` have duration `d[i]` and start `s[i]`.

1. **No overlap**: `s[i+1] >= s[i] + d[i]` for all `i`.
2. **First track** (`i = 0`):
   - If anchored with target `t`: `s[0] = max(0, t)` (cannot start before race second 0).
   - Else: `s[0] = 0`.
3. **Later tracks** (`i > 0`):
   - `earliest = s[i-1] + d[i-1]`.
   - If anchored with target `t`: `s[i] = max(earliest, t)`. Set `anchorDeviationSeconds = s[i] - t` (positive when the anchor wanted an earlier start than `earliest`).
   - Else: `s[i] = earliest`.

Gaps are allowed when an anchor sets a later start than `earliest`. There is no extra padding beyond `orderedTrackIds` length.

**Closest feasible interpretation**: Under fixed order and no overlap, if an anchor requests `t < earliest`, the track starts at `earliest`; this minimizes how late the start is relative to `t` (zero slack backward).

### Output

`Arrangement.entries` in the same order as `plan.orderedTrackIds`, with `durationSecond` from `tracks`.

## `validatePlan(plan, tracks)`

Pure; returns an array of `PlanValidationError` (empty if valid). Checks:

### Structure and references

- Every `orderedTrackIds[i]` must exist in `tracks`.
- Every `anchors[k].trackId` must exist in `tracks`.
- **Duplicate anchor track**: two anchors with the same `trackId`.

### Coverage vs race length

Let `totalSeconds = sum(durationSecond for each id in orderedTrackIds)`.

- If `totalSeconds > targetTimeSeconds`: error — playlist would extend past target race time without overlap (physically impossible under no-overlap rules).
- If `totalSeconds < targetTimeSeconds`: error — total music duration is **strictly shorter** than target race time (“too short to cover the race” in the sense of wall-clock fill).

Equality `totalSeconds === targetTimeSeconds` is valid.

### Anchor timing bounds

For each anchor on `trackId` with duration `d` and `targetSecond`:

- `targetSecond < 0`: error.
- `targetSecond + d > targetTimeSeconds`: error (track would not finish by race end if it started at target).

### Pairwise anchor feasibility (fixed order)

Index anchors by their position in `orderedTrackIds`. For any two anchored indices `i < j` with targets `t_i`, `t_j`:

\[
t_j - t_i \geq \sum_{k=i}^{j-1} d[k]
\]

If not, anchors conflict given this order and durations.

Note: `computeArrangement` may still produce an arrangement with non-zero deviations when feasibility fails here; validation is the source of truth for “plan conflicts.” Callers can run `validatePlan` before or alongside arrangement.

## Error catalog

Structured errors use a `code` string for programmatic handling:

| `code` | When |
|--------|------|
| `UNKNOWN_TRACK` | `trackId` in plan or anchors missing from `tracks`. |
| `DUPLICATE_ANCHOR` | Same `trackId` appears in `anchors` more than once. |
| `DURATION_EXCEEDS_RACE` | Sum of track durations > `targetTimeSeconds`. |
| `DURATION_SHORT_OF_RACE` | Sum of track durations < `targetTimeSeconds`. |
| `ANCHOR_NEGATIVE_TIME` | `targetSecond < 0`. |
| `ANCHOR_ENDS_AFTER_RACE` | `targetSecond + durationSecond > targetTimeSeconds`. |
| `ANCHOR_CONFLICT` | Pairwise constraint between two anchors violated. |

Each error includes a human-readable `message` and optional `details` (e.g. `trackId`, `index`).
