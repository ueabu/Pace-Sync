"use client";

import { buildElevationChartLayout } from "@/lib/course/chartGeometry";
import type {
  CourseProfile,
  RacePlan,
  TimelineSongBlock,
} from "@/lib/types";
import { useEffect, useMemo, useRef, useState, type SVGProps } from "react";

function formatKm(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(m >= 10000 ? 0 : 1)} km`;
  return `${Math.round(m)} m`;
}

export type ElevationChartProps = {
  profile: CourseProfile;
  racePlan: RacePlan;
  songBlocks?: TimelineSongBlock[];
  /** Tailwind sizing; responsive height applies here */
  className?: string;
  title?: string;
} & Omit<SVGProps<SVGSVGElement>, "width" | "height">;

export function ElevationChart({
  profile,
  racePlan,
  songBlocks,
  className = "h-[7.5rem] sm:h-[9.5rem]",
  title = "Course elevation vs race distance",
  ...svgRest
}: ElevationChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 320, h: 120 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      const w = Math.max(160, rect?.width ?? 320);
      const h = Math.max(80, rect?.height ?? 120);
      setDims({ w, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(
    () =>
      buildElevationChartLayout(
        profile,
        racePlan,
        songBlocks,
        dims.w,
        dims.h
      ),
    [profile, racePlan, songBlocks, dims.w, dims.h]
  );

  const { padding, blockXs, xLabelEveryM } = layout;

  const ticks: number[] = [];
  for (
    let d = 0;
    d <= racePlan.distanceM + 0.001;
    d += xLabelEveryM
  ) {
    if (d <= racePlan.distanceM) ticks.push(d);
  }

  return (
    <div ref={wrapRef} className={`w-full overflow-hidden ${className}`}>
      <svg
        role="img"
        aria-label={title}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        preserveAspectRatio="none"
        className="h-full w-full text-zinc-500 dark:text-zinc-400"
        {...svgRest}
      >
        <title>{title}</title>
        <rect
          x={0}
          y={0}
          width={layout.width}
          height={layout.height}
          className="fill-transparent"
        />
        {ticks.map((distanceM) => {
          const x =
            padding.left +
            (distanceM / Math.max(1, racePlan.distanceM)) *
              (layout.width - padding.left - padding.right);
          return (
            <line
              key={distanceM}
              x1={x}
              y1={padding.top}
              x2={x}
              y2={layout.height - padding.bottom}
              className="stroke-zinc-200 dark:stroke-zinc-800"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        <path
          d={layout.areaD}
          className="fill-emerald-500/15 dark:fill-emerald-400/10"
        />
        <path
          d={layout.pathD}
          fill="none"
          className="stroke-emerald-600 dark:stroke-emerald-400"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {blockXs.map((b) => (
          <line
            key={b.id}
            x1={b.x}
            y1={padding.top}
            x2={b.x}
            y2={layout.height - padding.bottom}
            className="stroke-amber-500/80 dark:stroke-amber-300/80"
            strokeWidth={1.25}
            strokeDasharray="4 3"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <text
          x={4}
          y={padding.top + 10}
          className="fill-zinc-500 text-[10px] dark:fill-zinc-400"
        >
          {Math.round(layout.maxEle)} m
        </text>
        <text
          x={4}
          y={layout.height - padding.bottom - 4}
          className="fill-zinc-500 text-[10px] dark:fill-zinc-400"
        >
          {Math.round(layout.minEle)} m
        </text>
        {ticks.map((d) => {
          const x =
            padding.left +
            (d / Math.max(1, racePlan.distanceM)) *
              (layout.width - padding.left - padding.right);
          return (
            <text
              key={`lbl-${d}`}
              x={x}
              y={layout.height - 4}
              textAnchor="middle"
              className="fill-zinc-500 text-[9px] dark:fill-zinc-400"
            >
              {formatKm(d)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
