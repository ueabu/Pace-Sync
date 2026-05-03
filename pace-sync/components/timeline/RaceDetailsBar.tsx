"use client";

import { useTimelineArrangement } from "./timeline-arrangement-context";

export function RaceDetailsBar() {
  const { racePlan, setRacePlan } = useTimelineArrangement();

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-background/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 dark:border-zinc-800/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Race plan
          </p>
          <h1 className="text-lg font-semibold text-foreground">
            Timeline editor
          </h1>
        </div>
        <div className="flex flex-wrap items-end gap-3 sm:gap-4">
          <label className="flex min-w-[9rem] flex-1 flex-col gap-1 sm:flex-initial">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Distance
            </span>
            <div className="flex rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-950">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                aria-label="Race distance"
                className="min-w-0 flex-1 rounded-l-lg bg-transparent px-3 py-2.5 text-base text-foreground outline-none sm:text-sm"
                value={Number.isFinite(racePlan.distance) ? racePlan.distance : 0}
                onChange={(e) =>
                  setRacePlan({
                    distance: Number.parseFloat(e.target.value) || 0,
                  })
                }
              />
              <select
                aria-label="Distance unit"
                className="max-w-[5.5rem] shrink-0 rounded-r-lg border-l border-zinc-200 bg-zinc-50 px-2 py-2 text-sm text-foreground dark:border-zinc-700 dark:bg-zinc-900"
                value={racePlan.distanceUnit}
                onChange={(e) =>
                  setRacePlan({
                    distanceUnit: e.target.value as "km" | "mi",
                  })
                }
              >
                <option value="km">km</option>
                <option value="mi">mi</option>
              </select>
            </div>
          </label>
          <fieldset className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-initial">
            <legend className="text-xs text-zinc-500 dark:text-zinc-400">
              Target time
            </legend>
            <div className="flex gap-2 rounded-lg border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-950">
              <label className="flex flex-1 flex-col gap-0.5">
                <span className="sr-only">Hours</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="w-full rounded-md border border-zinc-200 bg-transparent px-2 py-2 text-center text-base text-foreground outline-none dark:border-zinc-700 sm:text-sm"
                  value={racePlan.targetHours}
                  onChange={(e) =>
                    setRacePlan({
                      targetHours: Math.max(
                        0,
                        Number.parseInt(e.target.value, 10) || 0,
                      ),
                    })
                  }
                />
                <span className="text-center text-[10px] uppercase text-zinc-500">
                  hr
                </span>
              </label>
              <label className="flex flex-1 flex-col gap-0.5">
                <span className="sr-only">Minutes</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={59}
                  className="w-full rounded-md border border-zinc-200 bg-transparent px-2 py-2 text-center text-base text-foreground outline-none dark:border-zinc-700 sm:text-sm"
                  value={racePlan.targetMinutes}
                  onChange={(e) =>
                    setRacePlan({
                      targetMinutes: Math.min(
                        59,
                        Math.max(0, Number.parseInt(e.target.value, 10) || 0),
                      ),
                    })
                  }
                />
                <span className="text-center text-[10px] uppercase text-zinc-500">
                  min
                </span>
              </label>
              <label className="flex flex-1 flex-col gap-0.5">
                <span className="sr-only">Seconds</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={59}
                  className="w-full rounded-md border border-zinc-200 bg-transparent px-2 py-2 text-center text-base text-foreground outline-none dark:border-zinc-700 sm:text-sm"
                  value={racePlan.targetSeconds}
                  onChange={(e) =>
                    setRacePlan({
                      targetSeconds: Math.min(
                        59,
                        Math.max(0, Number.parseInt(e.target.value, 10) || 0),
                      ),
                    })
                  }
                />
                <span className="text-center text-[10px] uppercase text-zinc-500">
                  sec
                </span>
              </label>
            </div>
          </fieldset>
        </div>
      </div>
    </header>
  );
}
