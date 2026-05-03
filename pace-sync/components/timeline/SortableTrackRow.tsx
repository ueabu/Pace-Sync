"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties, MouseEvent } from "react";
import { formatRaceClock } from "./format-race-clock";
import type { TimelineTrack } from "./types";
import { useTimelineArrangement } from "./timeline-arrangement-context";

type SortableTrackRowProps = {
  track: TimelineTrack;
};

export function SortableTrackRow({ track }: SortableTrackRowProps) {
  const {
    raceDurationSeconds,
    startByTrackId,
    selectedTrackId,
    setSelectedTrackId,
    placeAnchorFromRatio,
    togglePinAtComputedStart,
  } = useTimelineArrangement();

  const start = startByTrackId[track.id] ?? 0;
  const durationSec = Math.max(1, track.durationMs / 1000);
  const leftPct =
    raceDurationSeconds > 0 ? (start / raceDurationSeconds) * 100 : 0;
  const widthPct =
    raceDurationSeconds > 0
      ? Math.min(100, (durationSec / raceDurationSeconds) * 100)
      : 0;
  const minBlockPct = 3;
  const visualWidthPct = Math.max(widthPct, minBlockPct);
  const isPinned = track.anchorSeconds != null;
  const isSelected = selectedTrackId === track.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : undefined,
  };

  function onLanePointerDown(e: MouseEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
  }

  function onLaneClick(e: MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("[data-timeline-block]")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = rect.width > 0 ? x / rect.width : 0;
    placeAnchorFromRatio(track.id, ratio);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "flex items-stretch gap-2 rounded-xl border bg-white px-2 py-2 shadow-sm dark:bg-zinc-950",
        isDragging ? "opacity-90 ring-2 ring-emerald-500/40" : "",
        isPinned
          ? "border-amber-400/80 ring-1 ring-amber-400/40 dark:border-amber-500/60"
          : "border-zinc-200 dark:border-zinc-800",
        isSelected ? "ring-2 ring-emerald-600/50" : "",
      ].join(" ")}
    >
      <button
        type="button"
        className="inline-flex min-h-11 min-w-11 shrink-0 cursor-grab touch-manipulation items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 active:cursor-grabbing dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
        aria-label={`Drag to reorder ${track.name}`}
        {...attributes}
        {...listeners}
      >
        <span className="text-lg leading-none" aria-hidden>
          ⋮⋮
        </span>
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className="truncate text-sm font-medium text-foreground">
            {track.name}
          </p>
          {isPinned ? (
            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              Pinned
            </span>
          ) : null}
        </div>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {track.artists.join(", ")}
        </p>
        <div
          role="presentation"
          className="relative mt-2 h-12 w-full rounded-lg bg-zinc-100 dark:bg-zinc-900"
          onPointerDown={onLanePointerDown}
          onClick={onLaneClick}
        >
          <button
            type="button"
            data-timeline-block
            className={[
              "absolute top-1 bottom-1 max-w-[calc(100%-0.25rem)] rounded-md px-2 text-left text-xs font-medium text-white shadow-sm transition-colors",
              isPinned
                ? "bg-amber-600 hover:bg-amber-500"
                : "bg-emerald-700 hover:bg-emerald-600",
            ].join(" ")}
            style={{
              left: `${leftPct}%`,
              width: `${visualWidthPct}%`,
              minWidth: "2.75rem",
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTrackId(track.id);
            }}
          >
            <span className="line-clamp-2 leading-tight">{track.name}</span>
          </button>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-center gap-2">
        <p className="text-right">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Starts
          </span>
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {formatRaceClock(start)}
          </span>
        </p>
        <button
          type="button"
          onClick={() => togglePinAtComputedStart(track.id)}
          className={[
            "min-h-10 min-w-10 rounded-full border text-sm font-semibold touch-manipulation",
            isPinned
              ? "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
              : "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
          ].join(" ")}
          aria-pressed={isPinned}
          aria-label={isPinned ? "Unpin track" : "Pin track at computed start"}
        >
          📍
        </button>
      </div>
    </div>
  );
}
