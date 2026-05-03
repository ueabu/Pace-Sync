import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { fetchPlaylistTrackUris } from "@/lib/spotify/playlists";
import { TimelineShell } from "@/components/timeline-shell";

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
  const rawName =
    typeof sp.sourcePlaylistName === "string" ? sp.sourcePlaylistName : "";
  const sourcePlaylistName = rawName;

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
    <TimelineShell
      accessTokenPresent={Boolean(session.accessToken)}
      sourcePlaylistId={sourcePlaylistId}
      sourcePlaylistName={sourcePlaylistName}
      initialTrackUris={initialTrackUris}
      loadError={loadError}
    />
  );
}
