"use client";

import {
  CourseProfileProvider,
  ElevationChart,
  GpxUpload,
  RaceCourseSearch,
  useCourseProfileOptional,
} from "@/components/course";
import { parseCourseProfileFromPersistence } from "@/lib/course/coursePersistence";
import type { RacePlan, TimelineSongBlock } from "@/lib/types";
import { useMemo, useState } from "react";

const DEMO_METERS_PRESETS = [
  { label: "HM", m: 21_097 },
  { label: "Marathon", m: 42_195 },
];

function TimelineDemoStripe({
  racePlan,
  blocks,
}: {
  racePlan: RacePlan;
  blocks: TimelineSongBlock[];
}) {
  const denom = Math.max(1, racePlan.distanceM);
  return (
    <div className="w-full space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-black/45">
        Timeline placeholder (distance-aligned)
      </p>
      <div className="relative h-16 w-full overflow-hidden rounded-xl border border-black/10 bg-gradient-to-r from-white to-neutral-50">
        {blocks.map((b, i) => {
          const spanM = Math.max(
            denom * 0.05,
            b.distanceMWidth ?? denom * 0.12
          );
          const wPct = Math.min(
            96,
            Math.max((spanM / denom) * 100, denom > 8000 ? 6 : 9)
          );
          const leftPct = Math.max(
            0,
            Math.min(100 - wPct, (b.distanceMStart / denom) * 100)
          );
          const bg =
            [
              "from-emerald-600 to-teal-600",
              "from-sky-600 to-indigo-600",
              "from-amber-600 to-orange-600",
            ][i % 3] ?? "from-zinc-600 to-neutral-700";
          return (
            <div
              key={b.id}
              title={b.title}
              style={{ left: `${leftPct}%`, width: `${wPct}%` }}
              className={`absolute inset-y-2 flex items-center justify-center rounded-lg bg-gradient-to-br px-2 text-center text-[11px] font-semibold leading-tight text-white shadow ${bg}`}
            >
              <span className="line-clamp-2">{b.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CourseDemoSectionInner() {
  const ctx = useCourseProfileOptional();
  const profile = ctx?.profile ?? null;
  const setProfile = ctx?.setCourseProfile;

  const [distanceM, setDistanceM] = useState<number>(42_195);
  const [targetHours, setTargetHours] = useState<number>(4);
  const [targetMins, setTargetMins] = useState<number>(0);

  const racePlan: RacePlan = useMemo(() => {
    const targetSeconds = Math.round(targetHours * 3600 + targetMins * 60);
    return {
      distanceM: Math.max(100, distanceM),
      targetSeconds: Math.max(600, targetSeconds),
    };
  }, [distanceM, targetHours, targetMins]);

  const tempoMps = racePlan.distanceM / racePlan.targetSeconds;

  const blocks: TimelineSongBlock[] = useMemo(() => {
    const tracks = [
      { id: "1", title: "Warm‑up anthem", durS: 200 },
      { id: "2", title: "Climb push", durS: 240 },
      { id: "3", title: "Finish kick", durS: 210 },
    ];
    let t = 0;
    return tracks.map((tr) => {
      const startS = t;
      t += tr.durS;
      return {
        id: tr.id,
        title: tr.title,
        distanceMStart: tempoMps * startS,
        distanceMWidth: tempoMps * tr.durS,
      };
    });
  }, [racePlan.distanceM, racePlan.targetSeconds, tempoMps]);

  return (
    <section className="mt-14 w-full rounded-2xl border border-black/10 bg-neutral-50/80 p-4 sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-black">
        Optional course profile & elevation
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-black/60">
        Upload a GPX or try a lightweight public search — or skip entirely. You
        can build and sync a playlist without a course profile.
      </p>

      <div className="mt-4 flex flex-wrap gap-4">
        <fieldset className="min-w-[240px] flex-1 rounded-xl border border-black/[0.06] bg-white p-4">
          <legend className="px-1 text-xs font-semibold uppercase text-black/45">
            Race (demo sizing)
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {DEMO_METERS_PRESETS.map((p) => (
              <button
                key={p.m}
                type="button"
                onClick={() => setDistanceM(p.m)}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  distanceM === p.m
                    ? "bg-accent text-white shadow-sm"
                    : "bg-black/[0.04] text-black hover:bg-black/[0.07]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <label className="mt-4 flex flex-wrap items-center gap-2 text-sm text-black/80">
            <span className="whitespace-nowrap">Distance (m)</span>
            <input
              type="number"
              min={100}
              max={250_000}
              value={Math.round(distanceM)}
              onChange={(e) =>
                setDistanceM(
                  Math.min(
                    250_000,
                    Math.max(100, Number(e.target.value) || 100)
                  )
                )
              }
              className="min-w-[8rem] flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent/35"
            />
          </label>
          <div className="mt-4 flex flex-wrap gap-6 text-sm text-black/80">
            <label className="inline-flex items-center gap-2">
              Target h
              <input
                type="number"
                min={1}
                max={16}
                value={targetHours}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setTargetHours(
                    Number.isFinite(v) ? Math.min(16, Math.max(1, v)) : 1
                  );
                }}
                className="w-[4.25rem] rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm"
              />
            </label>
            <label className="inline-flex items-center gap-2">
              Target min
              <input
                type="number"
                min={0}
                max={59}
                value={targetMins}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setTargetMins(
                    Number.isFinite(v) ? Math.min(59, Math.max(0, v)) : 0
                  );
                }}
                className="w-[4.25rem] rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm"
              />
            </label>
          </div>
        </fieldset>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <GpxUpload
          onParsed={(p) => setProfile?.(p)}
          onClear={() => setProfile?.(null)}
        />
        <RaceCourseSearch
          onSerializedCourse={(json) =>
            setProfile?.(parseCourseProfileFromPersistence(json))
          }
        />
      </div>

      <div className="mt-8 w-full space-y-3">
        <TimelineDemoStripe racePlan={racePlan} blocks={blocks} />
        {profile ? (
          <>
            <ElevationChart
              profile={profile}
              racePlan={racePlan}
              songBlocks={blocks}
              className="h-[8rem] sm:h-[10.5rem]"
            />
            {profile.totalAscentM != null ? (
              <p className="text-xs text-black/50">
                Approx climb:{" "}
                <span className="font-medium text-black/70">
                  {Math.round(profile.totalAscentM)} m
                </span>{" "}
                — verify with your own GPX for race day.
              </p>
            ) : null}
          </>
        ) : (
          <p className="rounded-xl border border-dashed border-black/15 bg-white px-4 py-8 text-center text-sm leading-relaxed text-black/55">
            No course loaded yet — elevation appears here when you upload a GPX
            or search finds route geometry (best-effort).
          </p>
        )}
      </div>

      <p className="mt-6 border-t border-black/[0.06] pt-4 text-[0.65rem] text-black/45">
        Course state flows through CourseProfileProvider. Persistence can call{" "}
        <code className="rounded bg-black/[0.04] px-1 font-mono text-[0.62rem]">
          getCourseProfileForPersistence(profile)
        </code>{" "}
        from <code className="font-mono text-[0.62rem]">lib/course</code> —
        this UI does not write to the database.
      </p>
    </section>
  );
}

/** Client landing strip: GPX/search + aligned elevation demo beneath marketing copy. */
export function HomeCourseIsland() {
  return (
    <CourseProfileProvider>
      <CourseDemoSectionInner />
    </CourseProfileProvider>
  );
}
