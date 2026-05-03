"use client";

import { SyncSpotifyDialog } from "@/components/sync-spotify-dialog";
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
    <div className="space-y-8">
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
          Spotify token missing.{" "}
          <a
            href="/api/auth/spotify/start"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            Connect Spotify
          </a>{" "}
          again.
        </p>
      ) : null}

      <div className="flex flex-col gap-4 border-b border-black/8 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Timeline
          </h1>
          <p className="max-w-prose text-sm leading-relaxed text-black/65">
            Line up your playlist with the miles you will actually run. The
            canvas lands here next — until then, you can sync the current order
            straight to Spotify.
          </p>
          {sourcePlaylistName ? (
            <p className="pt-1 text-sm font-medium text-foreground">
              {sourcePlaylistName}
            </p>
          ) : (
            <p className="pt-1 text-sm text-black/55">
              No playlist loaded — start from{" "}
              <a
                href="/playlists"
                className="font-medium text-accent underline-offset-4 hover:underline"
              >
                your library
              </a>
              .
            </p>
          )}
        </div>

        <div className="shrink-0 sm:pt-1">
          <SyncSpotifyDialog
            sourcePlaylistId={sourcePlaylistId}
            sourcePlaylistName={sourcePlaylistName}
            trackUris={initialTrackUris}
            trigger={
              <Button className="w-full min-w-[11rem] sm:w-auto" disabled={!canSync}>
                Sync to Spotify
              </Button>
            }
          />
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-black/15 bg-black/[0.02] px-4 py-16 text-center text-sm leading-relaxed text-black/55">
        Timeline canvas — owned by the editor workstream.
      </div>
    </div>
  );
}
