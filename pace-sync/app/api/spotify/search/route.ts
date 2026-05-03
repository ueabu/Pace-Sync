import { searchSpotifyTracks } from "@/lib/spotify/search";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  try {
    const tracks = await searchSpotifyTracks(q);
    return NextResponse.json({ tracks });
  } catch {
    return NextResponse.json(
      { tracks: [], error: "search_failed" },
      { status: 500 },
    );
  }
}
