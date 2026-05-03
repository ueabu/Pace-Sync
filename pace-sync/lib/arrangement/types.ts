export type ArrangementTrackInput = {
  id: string;
  durationMs: number;
  anchorSeconds?: number | null;
};

export type ArrangementInput = {
  raceDurationSeconds: number;
  tracks: ArrangementTrackInput[];
};

export type ArrangementSlot = {
  trackId: string;
  startTimeSeconds: number;
};

export type ArrangementResult = {
  slots: ArrangementSlot[];
};
