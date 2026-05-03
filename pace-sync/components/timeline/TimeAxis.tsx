"use client";

import { useMemo } from "react";
import { formatRaceClock } from "./format-race-clock";
import { useTimelineArrangement } from "./timeline-arrangement-context";

function tickStepSeconds(raceDuration: number): number {
  if (raceDuration <= 120) return 15;
  if (raceDuration <= 600) return 60;
  if (raceDuration <= 3600) return 300;
  return 900;
}

function distanceAtUnit(
  t: number,
  raceDuration: number,
  distance: number,
): number {
  const ratio = raceDuration > 0 ? t / raceDuration : 0;
  return ratio * distance;
}

export function TimeAxis() {
  const { racePlan, raceDurationSeconds } = useTimelineArrangement();

  const ticks = useMemo(() => {
    const step = tickStepSeconds(raceDurationSeconds);
    const out: number[] = [];
    for (let t = 0; t <= raceDurationSeconds; t += step) {
      out.push(t);
    }
    if (out[out.length - 1] !== raceDurationSeconds) {
      out.push(raceDurationSeconds);
    }
    return out;
  }, [raceDurationSeconds]);

  const unitShort = racePlan.distanceUnit === "km" ? "km" : "mi";

  return (
    <div className="relative h-14 w-full select-none border-b border-zinc-200 dark:border-zinc-800">
      <div className="absolute inset-x-0 top-0 flex h-5 items-end text-[10px] font-medium text-zinc-500 sm:text-xs dark:text-zinc-400">
        {ticks.map((t) => {
          const left =
            raceDurationSeconds > 0 ? (t / raceDurationSeconds) * 100 : 0;
          const dist = distanceAtUnit(
            t,
            raceDurationSeconds,
            racePlan.distance,
          );
          const distDisplay = dist;
          return (
            <div
              key={t}
              className="absolute flex -translate-x-1/2 flex-col items-center"
              style={{ left: `${left}%` }}
            >
              <span className="tabular-nums">{formatRaceClock(t)}</span>
              <span className="font-normal text-zinc-400 dark:text-zinc-500">
                {distDisplay.toFixed(1)}
                {unitShort}
              </span>
            </div>
          );
        })}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-4 border-t border-zinc-200 dark:border-zinc-800">
        {ticks.map((t) => {
          const left =
            raceDurationSeconds > 0 ? (t / raceDurationSeconds) * 100 : 0;
          return (
            <div
              key={`tick-${t}`}
              className="absolute bottom-0 h-2 w-px -translate-x-1/2 bg-zinc-300 dark:bg-zinc-600"
              style={{ left: `${left}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}
