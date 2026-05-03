import type {
  Anchor,
  PlanValidationError,
  RacePlan,
  Track,
} from "../types";

function unknownTrack(trackId: string, context: string): PlanValidationError {
  return {
    code: "UNKNOWN_TRACK",
    message: `Unknown track id (${context}): ${trackId}`,
    details: { trackId, context },
  };
}

export function validatePlan(plan: RacePlan, tracks: Track[]): PlanValidationError[] {
  const errors: PlanValidationError[] = [];
  const byId = new Map(tracks.map((t) => [t.id, t] as const));

  const seenAnchor = new Set<string>();
  for (const a of plan.anchors) {
    if (seenAnchor.has(a.trackId)) {
      errors.push({
        code: "DUPLICATE_ANCHOR",
        message: `Duplicate anchor for track: ${a.trackId}`,
        details: { trackId: a.trackId },
      });
    }
    seenAnchor.add(a.trackId);
    if (!byId.has(a.trackId)) {
      errors.push(unknownTrack(a.trackId, "anchor"));
    }
  }

  for (let i = 0; i < plan.orderedTrackIds.length; i++) {
    const id = plan.orderedTrackIds[i];
    if (!byId.has(id)) {
      errors.push(unknownTrack(id, `orderedTrackIds[${i}]`));
    }
  }

  const durations = plan.orderedTrackIds.map((id) => {
    const t = byId.get(id);
    return t ? t.durationMs / 1000 : 0;
  });
  const totalSeconds = durations.reduce((a, b) => a + b, 0);

  if (totalSeconds > plan.targetTimeSeconds) {
    errors.push({
      code: "DURATION_EXCEEDS_RACE",
      message: `Total track duration (${totalSeconds}s) exceeds target race time (${plan.targetTimeSeconds}s)`,
      details: { totalSeconds: Math.round(totalSeconds * 1000) / 1000, targetTimeSeconds: plan.targetTimeSeconds },
    });
  }
  if (totalSeconds < plan.targetTimeSeconds) {
    errors.push({
      code: "DURATION_SHORT_OF_RACE",
      message: `Total track duration (${totalSeconds}s) is shorter than target race time (${plan.targetTimeSeconds}s)`,
      details: { totalSeconds: Math.round(totalSeconds * 1000) / 1000, targetTimeSeconds: plan.targetTimeSeconds },
    });
  }

  const anchorByTrackId = new Map<string, Anchor>();
  for (const a of plan.anchors) {
    anchorByTrackId.set(a.trackId, a);
  }

  for (const a of plan.anchors) {
    const track = byId.get(a.trackId);
    const d = track ? track.durationMs / 1000 : 0;
    if (a.targetSecond < 0) {
      errors.push({
        code: "ANCHOR_NEGATIVE_TIME",
        message: `Anchor for ${a.trackId} has negative targetSecond`,
        details: { trackId: a.trackId, targetSecond: a.targetSecond },
      });
    }
    if (a.targetSecond + d > plan.targetTimeSeconds) {
      errors.push({
        code: "ANCHOR_ENDS_AFTER_RACE",
        message: `Track ${a.trackId} would end after race time if anchored at ${a.targetSecond}s`,
        details: { trackId: a.trackId, targetSecond: a.targetSecond, durationSecond: d, targetTimeSeconds: plan.targetTimeSeconds },
      });
    }
  }

  const anchoredIndices: { index: number; targetSecond: number; trackId: string }[] = [];
  for (let i = 0; i < plan.orderedTrackIds.length; i++) {
    const id = plan.orderedTrackIds[i];
    const anchor = anchorByTrackId.get(id);
    if (anchor) {
      anchoredIndices.push({ index: i, targetSecond: anchor.targetSecond, trackId: id });
    }
  }

  for (let a = 0; a < anchoredIndices.length; a++) {
    for (let b = a + 1; b < anchoredIndices.length; b++) {
      const i = anchoredIndices[a].index;
      const j = anchoredIndices[b].index;
      if (j <= i) continue;
      const tI = anchoredIndices[a].targetSecond;
      const tJ = anchoredIndices[b].targetSecond;
      let minGap = 0;
      for (let k = i; k < j; k++) {
        minGap += durations[k];
      }
      if (tJ - tI < minGap - 1e-9) {
        errors.push({
          code: "ANCHOR_CONFLICT",
          message: `Anchors on ${anchoredIndices[a].trackId} and ${anchoredIndices[b].trackId} are incompatible with track order and durations`,
          details: {
            trackIdA: anchoredIndices[a].trackId,
            trackIdB: anchoredIndices[b].trackId,
            indexA: i,
            indexB: j,
          },
        });
      }
    }
  }

  return errors;
}
