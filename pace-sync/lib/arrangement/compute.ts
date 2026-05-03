import type {
  ArrangementInput,
  ArrangementResult,
  ArrangementSlot,
} from "./types";

/**
 * Computes start times for each track within the race window.
 *
 * TODO: Replace this stub with the full Pacelist arrangement engine (ordering,
 * anchors, gaps, and overlap resolution). The UI must keep calling this module
 * only—do not duplicate placement logic in components.
 */
export function computeArrangement(input: ArrangementInput): ArrangementResult {
  const { raceDurationSeconds, tracks } = input;
  const n = tracks.length;
  const duration = Math.max(1, raceDurationSeconds);

  if (n === 0) {
    return { slots: [] };
  }

  const slots: ArrangementSlot[] = tracks.map((t, i) => {
    if (t.anchorSeconds != null && Number.isFinite(t.anchorSeconds)) {
      const clamped = Math.min(
        Math.max(0, t.anchorSeconds),
        Math.max(0, duration - 1),
      );
      return { trackId: t.id, startTimeSeconds: clamped };
    }

    const step = duration / (n + 1);
    return { trackId: t.id, startTimeSeconds: step * (i + 1) };
  });

  return { slots };
}
