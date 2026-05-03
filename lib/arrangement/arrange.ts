import type { Arrangement, ArrangementEntry, RacePlan, Track } from "../types";

function durationSecond(track: Track | undefined): number {
  if (!track) return 0;
  return track.durationMs / 1000;
}

export function computeArrangement(plan: RacePlan, tracks: Track[]): Arrangement {
  const byId = new Map(tracks.map((t) => [t.id, t] as const));
  const anchorById = new Map(plan.anchors.map((a) => [a.trackId, a.targetSecond] as const));

  const entries: ArrangementEntry[] = [];

  for (let i = 0; i < plan.orderedTrackIds.length; i++) {
    const id = plan.orderedTrackIds[i];
    const d = durationSecond(byId.get(id));
    const targetAnchor = anchorById.get(id);

    let startSecond: number;
    if (i === 0) {
      startSecond = targetAnchor === undefined ? 0 : Math.max(0, targetAnchor);
    } else {
      const prev = entries[i - 1];
      const earliest = prev.startSecond + prev.durationSecond;
      startSecond = targetAnchor === undefined ? earliest : Math.max(earliest, targetAnchor);
    }

    const entry: ArrangementEntry = {
      trackId: id,
      startSecond,
      durationSecond: d,
    };
    if (targetAnchor !== undefined) {
      entry.anchorDeviationSeconds = startSecond - targetAnchor;
    }
    entries.push(entry);
  }

  return { entries };
}
