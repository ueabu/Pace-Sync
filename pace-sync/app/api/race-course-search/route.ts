import { buildCourseProfileFromRoute } from "@/lib/course/courseFromRoute";
import { fetchOpenElevationMeters } from "@/lib/course/fetchElevations";
import { getCourseProfileForPersistence } from "@/lib/course/coursePersistence";
import { lookupRaceCoursePolylinePublic } from "@/lib/course/publicCourseSearch";

export const runtime = "nodejs";

type Body = { query?: string };

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json(
      { ok: false, error: "Invalid JSON." },
      { status: 400 }
    );
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (query.length < 3) {
    return Response.json({ ok: false, error: "Query too short." }, {
      status: 400,
    });
  }

  try {
    const hit = await lookupRaceCoursePolylinePublic(query);

    if (!hit.ok || hit.line.length < 2) {
      return Response.json({
        ok: false,
        error: "Course not found. Upload a GPX instead.",
      });
    }

    const elev = await fetchOpenElevationMeters(hit.line);
    const profile = buildCourseProfileFromRoute(hit.line, {
      elevationM: elev,
    });

    const hasEle = elev.some((e) => e != null && Number.isFinite(e));
    const hint = `Geometry from ${hit.source}. ${hasEle ? "Elevations sampled from Open-Elevation (approx.)." : "Elevation service unavailable — flat baseline shown; GPX strongly recommended."}`;

    return Response.json({
      ok: true,
      serializedProfile: getCourseProfileForPersistence(profile)!,
      hint,
    });
  } catch {
    return Response.json({
      ok: false,
      error: "Search failed. Upload a GPX instead.",
    });
  }
}
