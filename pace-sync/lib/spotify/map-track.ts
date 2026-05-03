import type { Track } from "@/lib/types";
import type { SpotifyTrackObject } from "./raw-types";

export function toTrack(
  track: SpotifyTrackObject | null | undefined,
): Track | null {
  if (
    track == null ||
    track.type === "episode" ||
    track.is_local === true ||
    !track.id ||
    typeof track.duration_ms !== "number"
  ) {
    return null;
  }
  return {
    id: track.id,
    name: track.name ?? "",
    artists:
      track.artists?.map((a) => a.name).filter((n): n is string => Boolean(n)) ??
      [],
    durationMs: track.duration_ms,
  };
}
