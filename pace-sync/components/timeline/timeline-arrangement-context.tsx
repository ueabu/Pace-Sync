"use client";

import { computeArrangement } from "@/lib/arrangement";
import type { SpotifySearchTrack } from "@/lib/spotify";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  RacePlanState,
  TimelineArrangementContextValue,
  TimelineTrack,
} from "./types";

const TimelineArrangementContext =
  createContext<TimelineArrangementContextValue | null>(null);

function raceDurationFromPlan(plan: RacePlanState): number {
  const h = Math.max(0, Math.floor(plan.targetHours));
  const m = Math.max(0, Math.min(59, Math.floor(plan.targetMinutes)));
  const s = Math.max(0, Math.min(59, Math.floor(plan.targetSeconds)));
  return h * 3600 + m * 60 + s;
}

function buildStartMap(
  arrangement: TimelineArrangementContextValue["arrangement"],
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const slot of arrangement.slots) {
    map[slot.trackId] = slot.startTimeSeconds;
  }
  return map;
}

export function TimelineArrangementProvider({ children }: { children: ReactNode }) {
  const [racePlan, setRacePlanState] = useState<RacePlanState>({
    distance: 42.195,
    distanceUnit: "km",
    targetHours: 4,
    targetMinutes: 0,
    targetSeconds: 0,
  });

  const [tracks, setTracks] = useState<TimelineTrack[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  const setRacePlan = useCallback((patch: Partial<RacePlanState>) => {
    setRacePlanState((prev) => ({ ...prev, ...patch }));
  }, []);

  const raceDurationSeconds = useMemo(
    () => Math.max(1, raceDurationFromPlan(racePlan)),
    [racePlan],
  );

  const arrangement = useMemo(
    () =>
      computeArrangement({
        raceDurationSeconds,
        tracks: tracks.map((t) => ({
          id: t.id,
          durationMs: t.durationMs,
          anchorSeconds: t.anchorSeconds,
        })),
      }),
    [raceDurationSeconds, tracks],
  );

  const startByTrackId = useMemo(
    () => buildStartMap(arrangement),
    [arrangement],
  );

  const timelineContentMinWidthPx = useMemo(
    () =>
      Math.round(
        Math.max(320, Math.min(1600, raceDurationSeconds * 2.75)),
      ),
    [raceDurationSeconds],
  );

  const togglePinAtComputedStart = useCallback(
    (trackId: string) => {
      setTracks((prev) => {
        const nextStarts = computeArrangement({
          raceDurationSeconds,
          tracks: prev.map((t) => ({
            id: t.id,
            durationMs: t.durationMs,
            anchorSeconds: t.anchorSeconds,
          })),
        });
        const startFor = nextStarts.slots.find((s) => s.trackId === trackId)
          ?.startTimeSeconds;
        return prev.map((t) => {
          if (t.id !== trackId) return t;
          const pinned = t.anchorSeconds != null;
          if (pinned) {
            return { ...t, anchorSeconds: null };
          }
          if (startFor == null) return t;
          return { ...t, anchorSeconds: startFor };
        });
      });
    },
    [raceDurationSeconds],
  );

  const placeAnchorFromRatio = useCallback(
    (trackId: string, ratio01: number) => {
      const r = Math.min(1, Math.max(0, ratio01));
      const at = r * raceDurationSeconds;
      setTracks((prev) =>
        prev.map((t) =>
          t.id === trackId ? { ...t, anchorSeconds: at } : t,
        ),
      );
      setSelectedTrackId(trackId);
    },
    [raceDurationSeconds],
  );

  const addTrackFromSpotify = useCallback((track: SpotifySearchTrack) => {
    setTracks((prev) => {
      if (prev.some((t) => t.id === track.id)) return prev;
      return [
        ...prev,
        {
          id: track.id,
          name: track.name,
          artists: track.artists,
          durationMs: track.durationMs,
          anchorSeconds: null,
        },
      ];
    });
  }, []);

  const value = useMemo<TimelineArrangementContextValue>(
    () => ({
      racePlan,
      setRacePlan,
      tracks,
      setTracks,
      arrangement,
      startByTrackId,
      raceDurationSeconds,
      selectedTrackId,
      setSelectedTrackId,
      togglePinAtComputedStart,
      placeAnchorFromRatio,
      addTrackFromSpotify,
      timelineContentMinWidthPx,
    }),
    [
      addTrackFromSpotify,
      arrangement,
      placeAnchorFromRatio,
      raceDurationSeconds,
      racePlan,
      selectedTrackId,
      setRacePlan,
      startByTrackId,
      timelineContentMinWidthPx,
      togglePinAtComputedStart,
      tracks,
    ],
  );

  return (
    <TimelineArrangementContext.Provider value={value}>
      {children}
    </TimelineArrangementContext.Provider>
  );
}

export function useTimelineArrangement(): TimelineArrangementContextValue {
  const ctx = useContext(TimelineArrangementContext);
  if (!ctx) {
    throw new Error(
      "useTimelineArrangement must be used within TimelineArrangementProvider",
    );
  }
  return ctx;
}
