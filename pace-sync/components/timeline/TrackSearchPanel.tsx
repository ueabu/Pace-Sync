"use client";

import { useEffect, useState } from "react";
import type { SpotifySearchTrack } from "@/lib/spotify";
import { useTimelineArrangement } from "./timeline-arrangement-context";

type SearchResponse = { tracks: SpotifySearchTrack[] };

export function TrackSearchPanel() {
  const { addTrackFromSpotify } = useTimelineArrangement();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<SpotifySearchTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 320);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!debounced) {
      return;
    }

    const ctrl = new AbortController();
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/spotify/search?q=${encodeURIComponent(debounced)}`,
          { signal: ctrl.signal },
        );
        if (!res.ok) throw new Error("Search failed");
        const json = (await res.json()) as SearchResponse;
        setResults(json.tracks ?? []);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError("Could not search. Try again.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }
    void run();
    return () => ctrl.abort();
  }, [debounced]);

  const visibleResults = debounced ? results : [];
  const visibleError = debounced ? error : null;

  return (
    <aside className="flex w-full flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 lg:max-w-sm lg:shrink-0">
      <div>
        <label htmlFor="track-search" className="text-sm font-semibold">
          Add tracks
        </label>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Search Spotify and append to this arrangement.
        </p>
      </div>
      <input
        id="track-search"
        type="search"
        autoComplete="off"
        placeholder="Song or artist"
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 text-base text-foreground outline-none ring-emerald-700/0 transition focus:ring-2 focus:ring-emerald-600 dark:border-zinc-700 dark:bg-zinc-900 sm:text-sm"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="min-h-0 flex-1">
        {debounced && loading ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Searching…</p>
        ) : null}
        {debounced && visibleError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{visibleError}</p>
        ) : null}
        <ul className="mt-2 max-h-72 space-y-2 overflow-y-auto sm:mx-0 sm:max-h-96">
          {visibleResults.map((t) => (
            <li
              key={t.id}
              className="flex gap-2 rounded-xl border border-zinc-100 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-900/40"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {t.name}
                </p>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {t.artists.join(", ")}
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white touch-manipulation hover:bg-emerald-600"
                onClick={() => addTrackFromSpotify(t)}
              >
                Add
              </button>
            </li>
          ))}
        </ul>
        {!loading && debounced && visibleResults.length === 0 && !visibleError ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No results.
          </p>
        ) : null}
      </div>
    </aside>
  );
}
