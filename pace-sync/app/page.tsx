import Link from "next/link";

import { getSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await getSession();
  const authed = session.status === "authed";

  return (
    <div className="flex flex-col gap-10 pb-16 pt-2 sm:pt-4">
      <div className="space-y-5">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-accent">
          Runner&apos;s tool
        </p>
        <h1 className="max-w-xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
          Pace your playlist the way you pace a race.
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-black/65">
          Pacelist lines up your Spotify setlist with the miles in front of you —
          so the song that fires you up lands on the stretch where you need it.
        </p>
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        {authed ? (
          <>
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/playlists">Choose a playlist</Link>
            </Button>
            <p className="text-sm text-black/55 sm:max-w-xs">
              You are connected. Open your library and pull a list into the
              timeline.
            </p>
          </>
        ) : (
          <>
            <Button asChild size="lg" className="w-full sm:w-auto">
              <a href="/api/auth/spotify/start">Connect Spotify</a>
            </Button>
            <p className="text-sm text-black/55 sm:max-w-xs">
              One login. Then import a playlist and start placing it on your
              course.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
