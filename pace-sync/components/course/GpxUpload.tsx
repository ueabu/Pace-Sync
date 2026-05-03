"use client";

import { parseGpx, validateGpx } from "@/lib/course/gpx";
import type { CourseProfile } from "@/lib/types";
import {
  forwardRef,
  useId,
  useRef,
  useState,
  type KeyboardEventHandler,
} from "react";

export type GpxUploadProps = {
  onParsed: (profile: CourseProfile) => void;
  onClear?: () => void;
  className?: string;
};

export const GpxUpload = forwardRef<HTMLInputElement, GpxUploadProps>(
  function GpxUpload({ onParsed, onClear, className }, forwardedRef) {
    const fallbackRef = useRef<HTMLInputElement>(null);
    const innerRef = forwardedRef ?? fallbackRef;
    const id = useId();
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const pickFiles = async (files: FileList | null) => {
      const f = files?.[0];
      if (!f) return;
      setBusy(true);
      setError(null);
      try {
        const txt = await f.text();
        const v = validateGpx(txt);
        if (!v.ok) throw new Error(v.error ?? "Invalid GPX.");
        const profile = parseGpx(txt);
        onParsed(profile);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not read GPX.");
      } finally {
        setBusy(false);
        if (typeof innerRef !== "function" && innerRef.current)
          innerRef.current.value = "";
      }
    };

    const onKey: KeyboardEventHandler<HTMLLabelElement> = (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        (
          typeof innerRef === "function" ? fallbackRef.current : innerRef.current
        )?.click();
      }
    };

    return (
      <div className={className ?? ""}>
        <input
          id={id}
          ref={innerRef}
          type="file"
          accept=".gpx,application/gpx+xml"
          className="sr-only"
          disabled={busy}
          onChange={(e) => void pickFiles(e.target.files)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor={id}
            tabIndex={0}
            role="button"
            onKeyDown={onKey}
            className={`inline-flex cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 ${
              busy ? "pointer-events-none opacity-60" : ""
            }`}
          >
            {busy ? "Reading…" : "Upload GPX"}
          </label>
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm text-zinc-600 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            onClick={() => {
              setError(null);
              if (typeof innerRef !== "function" && innerRef.current)
                innerRef.current.value = "";
              onClear?.();
            }}
          >
            Clear course
          </button>
        </div>
        {error ? (
          <p
            role="alert"
            className="mt-2 text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);
