export type Track = {
  id: string;
  name: string;
  artists: string[];
  /** Duration in milliseconds (glossary). */
  durationMs: number;
};

export type Anchor = {
  trackId: string;
  /** Desired start time of this track on the race clock, in seconds. */
  targetSecond: number;
};

export type RacePlan = {
  distanceMeters: number;
  targetTimeSeconds: number;
  anchors: Anchor[];
  orderedTrackIds: string[];
};

export type ArrangementEntry = {
  trackId: string;
  startSecond: number;
  durationSecond: number;
  /** Present when this track has an anchor; signed: startSecond - targetSecond. */
  anchorDeviationSeconds?: number;
};

export type Arrangement = {
  entries: ArrangementEntry[];
};

export type PlanValidationErrorCode =
  | "UNKNOWN_TRACK"
  | "DUPLICATE_ANCHOR"
  | "DURATION_EXCEEDS_RACE"
  | "DURATION_SHORT_OF_RACE"
  | "ANCHOR_NEGATIVE_TIME"
  | "ANCHOR_ENDS_AFTER_RACE"
  | "ANCHOR_CONFLICT";

export type PlanValidationError = {
  code: PlanValidationErrorCode;
  message: string;
  details?: Record<string, string | number | undefined>;
};
