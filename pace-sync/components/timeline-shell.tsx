"use client";

import { SyncSpotifyDialog } from "@/components/sync-spotify-dialog";
import { SPOTIFY_AUTH_PATH } from "@/lib/spotify/constants";
import { Button } from "@/components/ui/button";

export function TimelineShell({
  accessTokenPresent,
  sourcePlaylistId,
  sourcePlaylistName,
  initialTrackUris,
  loadError,
}: {
  accessTokenPresent: boolean;
  sourcePlaylistId: string;
  sourcePlaylistName: string;
  initialTrackUris: string[];
  loadError: string | null;
}) {
  const canSync = Boolean(sourcePlaylistId) && accessTokenPresent && !loadError;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3">
      {loadError ? (
        <p
          className="rounded-md border border-black/10 bg-amber-50 px-3 py-2 text-sm text-amber-950"
          role="alert"
        >
          {loadError}
        </p>
      ) : null}
      {!accessTokenPresent ? (
        <p className="text-sm text-black/65">
          Spotify session missing.{" "}
          <a
            href={SPOTIFY_AUTH_PATH}
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            Connect Spotify
          </a>{" "}
          again.
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          {sourcePlaylistName ? (
            <p className="text-sm font-medium text-foreground">
              {sourcePlaylistName}
            </p>
          ) : (
            <p className="text-sm text-black/55">
              No playlist loaded — pick one from{" "}
              <a
                href="/playlists"
                className="font-medium text-accent underline-offset-4 hover:underline"
              >
                your library
              </a>
              .
            </p>
          )}
          <p className="max-w-prose text-xs leading-relaxed text-black/55">
            Sync pushes the current track order below to Spotify (new playlist or
            replace the one you opened).
          </p>
        </div>

        <div className="shrink-0">
          <SyncSpotifyDialog
            sourcePlaylistId={sourcePlaylistId}
            sourcePlaylistName={sourcePlaylistName}
            trackUris={initialTrackUris}
            trigger={
              <Button
                className="w-full min-w-[11rem] sm:w-auto"
                variant="secondary"
                disabled={!canSync}
              >
                Sync to Spotify
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}
