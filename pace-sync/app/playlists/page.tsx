import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import {
  fetchUserPlaylists,
} from "@/lib/spotify/playlists";
import { SpotifyApiError } from "@/lib/spotify/http";
import type { SpotifyPlaylistSummary } from "@/lib/spotify/types";

import { Button } from "@/components/ui/button";

export default async function PlaylistsPage() {
  const session = await getSession();
  if (session.status !== "authed") {
    redirect("/");
  }

  if (!session.accessToken) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Connect Spotify
        </h1>
        <p className="text-sm text-black/65">
          You are signed in, but Pacelist does not have a Spotify access token
          yet. Finish connecting, then refresh this page.
        </p>
        <Button asChild>
          <a href="/api/auth/spotify/start">Connect Spotify</a>
        </Button>
      </div>
    );
  }

  let playlists: SpotifyPlaylistSummary[] = [];
  let error: string | null = null;

  try {
    playlists = await fetchUserPlaylists(session.accessToken);
  } catch (e) {
    if (e instanceof SpotifyApiError && e.status === 401) {
      error =
        "Spotify rejected this token. Reconnect your account and try again.";
    } else {
      error = "Could not load playlists from Spotify.";
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Pick a playlist
        </h1>
        <p className="max-w-prose text-sm leading-relaxed text-black/65">
          Choose the setlist you want to pace. We will pull it into the
          timeline — you keep the order for sync until the editor takes over.
        </p>
      </header>

      {error ? (
        <p
          className="rounded-md border border-black/10 bg-amber-50 px-3 py-2 text-sm text-amber-950"
          role="alert"
        >
          {error}{" "}
          <Link
            href="/api/auth/spotify/start"
            className="font-medium text-accent underline-offset-2 hover:underline"
          >
            Reconnect
          </Link>
        </p>
      ) : null}

      {playlists.length === 0 && !error ? (
        <p className="text-sm text-black/60">No playlists found.</p>
      ) : null}

      <ul className="grid list-none gap-3 sm:grid-cols-2">
        {playlists.map((p) => {
          const href = `/timeline?sourcePlaylistId=${encodeURIComponent(p.id)}&sourcePlaylistName=${encodeURIComponent(p.name)}&trackCount=${p.trackCount}`;
          return (
            <li key={p.id}>
              <Link
                href={href}
                className="flex items-center gap-3 rounded-lg border border-black/10 bg-white p-3 shadow-sm transition-colors hover:border-accent/35 hover:bg-accent/[0.03]"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-black/[0.06]">
                  {p.coverUrl ? (
                    <Image
                      src={p.coverUrl}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs text-black/45">
                      Mix
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium leading-snug">{p.name}</p>
                  <p className="text-xs text-black/55">
                    {p.trackCount} {p.trackCount === 1 ? "track" : "tracks"}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
