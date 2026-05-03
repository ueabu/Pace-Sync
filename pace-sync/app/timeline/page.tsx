import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { TimelineEditor } from "@/components/timeline/TimelineEditor";
import { TimelineShell } from "@/components/timeline-shell";
import { getSession } from "@/lib/auth/session";
import { fetchPlaylistTrackUris } from "@/lib/spotify/playlists";

export const metadata: Metadata = {
  title: "Timeline · Pacelist",
  description:
    "Arrange your playlist on the race timeline with anchors and Spotify search.",
};

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (session.status !== "authed") {
    redirect("/");
  }

  const sp = await searchParams;
  const sourcePlaylistId =
    typeof sp.sourcePlaylistId === "string" ? sp.sourcePlaylistId : "";
  const sourcePlaylistName =
    typeof sp.sourcePlaylistName === "string" ? sp.sourcePlaylistName : "";

  let initialTrackUris: string[] = [];
  let loadError: string | null = null;

  if (session.accessToken && sourcePlaylistId) {
    try {
      initialTrackUris = await fetchPlaylistTrackUris(
        session.accessToken,
        sourcePlaylistId,
      );
    } catch {
      loadError = "Could not load tracks for this playlist.";
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-black/8 bg-zinc-50 px-4 py-4 sm:px-6">
        <TimelineShell
          accessTokenPresent={Boolean(session.accessToken)}
          sourcePlaylistId={sourcePlaylistId}
          sourcePlaylistName={sourcePlaylistName}
          initialTrackUris={initialTrackUris}
          loadError={loadError}
        />
      </div>
      <TimelineEditor />
    </div>
  );
}
