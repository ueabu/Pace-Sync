"use client";

import { useState } from "react";

export type RaceCourseSearchProps = {
  /** Deserialized CourseProfile handled by parent (from API serializedProfile). */
  onSerializedCourse?: (json: string) => void;
  className?: string;
};

/** Bonus path: Photon + OSM backends via API; failures steer users to GPX. */
export function RaceCourseSearch({
  onSerializedCourse,
  className,
}: RaceCourseSearchProps) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "ok" | "notfound" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);

  const search = async () => {
    const trimmed = q.trim();
    if (trimmed.length < 3) {
      setStatus("idle");
      setMessage("Enter at least three characters.");
      return;
    }

    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/race-course-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        serializedProfile?: string;
        hint?: string;
        error?: string;
      };
      if (res.ok && data.ok && data.serializedProfile) {
        setStatus("ok");
        setMessage(data.hint ?? "Course geometry loaded.");
        onSerializedCourse?.(data.serializedProfile);
      } else {
        setStatus("notfound");
        setMessage(
          data.error ??
            "Course not found. Upload a GPX instead for an accurate elevation profile."
        );
      }
    } catch {
      setStatus("error");
      setMessage(
        "Search unavailable right now — upload a GPX for your course instead."
      );
    }
  };

  return (
    <div className={className ?? ""}>
      <label
        htmlFor="race-course-search"
        className="mb-1 block text-sm font-medium text-zinc-800 dark:text-zinc-100"
      >
        Search race (optional)
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="race-course-search"
          type="search"
          placeholder="Try a marathon name or known route corridor"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-w-[200px] flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          onKeyDown={(e) => {
            if (e.key === "Enter") void search();
          }}
        />
        <button
          type="button"
          onClick={() => void search()}
          disabled={status === "loading"}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {status === "loading" ? "Searching…" : "Find course"}
        </button>
      </div>
      {message ? (
        <p
          className={`mt-2 text-sm ${
            status === "ok"
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
          role={status === "notfound" ? "status" : undefined}
        >
          {message}{" "}
          {status === "notfound" || status === "error" ? (
            <strong className="font-medium text-zinc-900 dark:text-zinc-100">
              Try uploading a GPX file.
            </strong>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
