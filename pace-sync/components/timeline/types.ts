import type { ArrangementResult } from "@/lib/arrangement";
import type { SpotifySearchTrack } from "@/lib/spotify";

export type RacePlanState = {
  distance: number;
  distanceUnit: "km" | "mi";
  targetHours: number;
  targetMinutes: number;
  targetSeconds: number;
};

export type TimelineTrack = {
  id: string;
  name: string;
  artists: string[];
  durationMs: number;
  anchorSeconds?: number | null;
};

export type TimelineArrangementContextValue = {
  racePlan: RacePlanState;
  setRacePlan: (patch: Partial<RacePlanState>) => void;
  tracks: TimelineTrack[];
  setTracks: (
    next:
      | TimelineTrack[]
      | ((prev: TimelineTrack[]) => TimelineTrack[]),
  ) => void;
  arrangement: ArrangementResult;
  startByTrackId: Record<string, number>;
  raceDurationSeconds: number;
  selectedTrackId: string | null;
  setSelectedTrackId: (id: string | null) => void;
  togglePinAtComputedStart: (trackId: string) => void;
  placeAnchorFromRatio: (trackId: string, ratio01: number) => void;
  addTrackFromSpotify: (track: SpotifySearchTrack) => void;
  timelineContentMinWidthPx: number;
};
