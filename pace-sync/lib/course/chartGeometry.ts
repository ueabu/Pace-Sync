import type { CourseProfile, RacePlan, TimelineSongBlock } from "@/lib/types";

export type ElevationChartLayout = {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
  pathD: string;
  areaD: string;
  minEle: number;
  maxEle: number;
  /** x in SVG space for each song block start */
  blockXs: { id: string; title: string; x: number }[];
  xLabelEveryM: number;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Build SVG path and marker positions: x by race distance, y by elevation.
 */
export function buildElevationChartLayout(
  profile: CourseProfile,
  racePlan: RacePlan,
  songBlocks: TimelineSongBlock[] | undefined,
  width: number,
  height: number
): ElevationChartLayout {
  const padding = {
    top: 8,
    right: 8,
    bottom: 22,
    left: 36,
  };
  const innerW = Math.max(1, width - padding.left - padding.right);
  const innerH = Math.max(1, height - padding.top - padding.bottom);

  const pts = profile.points;
  let minEle = Infinity;
  let maxEle = -Infinity;
  for (const p of pts) {
    minEle = Math.min(minEle, p.elevationM);
    maxEle = Math.max(maxEle, p.elevationM);
  }
  if (!Number.isFinite(minEle) || !Number.isFinite(maxEle)) {
    minEle = 0;
    maxEle = 1;
  }
  const pad = Math.max(5, (maxEle - minEle) * 0.08);
  minEle -= pad;
  maxEle += pad;
  if (maxEle === minEle) {
    minEle -= 1;
    maxEle += 1;
  }

  const raceM = Math.max(1, racePlan.distanceM);

  const xOfDistance = (d: number) =>
    padding.left + (clamp(d, 0, raceM) / raceM) * innerW;

  const yOfEle = (e: number) =>
    padding.top + innerH - ((e - minEle) / (maxEle - minEle)) * innerH;

  const parts: string[] = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]!;
    const x = xOfDistance(p.distanceM);
    const y = yOfEle(p.elevationM);
    parts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  const pathD = parts.join(" ");

  const firstX = xOfDistance(pts[0]!.distanceM);
  const lastX = xOfDistance(Math.min(pts[pts.length - 1]!.distanceM, raceM));
  const baseY = padding.top + innerH;
  const areaD = `${pathD} L ${lastX.toFixed(2)} ${baseY} L ${firstX.toFixed(2)} ${baseY} Z`;

  const blockXs = (songBlocks ?? []).map((b) => ({
    id: b.id,
    title: b.title,
    x: xOfDistance(b.distanceMStart),
  }));

  const xLabelEveryM =
    raceM >= 10000 ? 5000 : raceM >= 5000 ? 1000 : raceM >= 1000 ? 500 : 100;

  return {
    width,
    height,
    padding,
    pathD,
    areaD,
    minEle,
    maxEle,
    blockXs,
    xLabelEveryM,
  };
}
