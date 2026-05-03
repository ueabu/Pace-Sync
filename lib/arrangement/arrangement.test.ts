import { describe, expect, test } from "bun:test";
import type { Anchor, RacePlan, Track } from "../types";
import { computeArrangement, computePace, validatePlan } from "./index";

function track(id: string, durationSeconds: number, name = id): Track {
  return {
    id,
    name,
    artists: ["a"],
    durationMs: durationSeconds * 1000,
  };
}

function plan(
  orderedTrackIds: string[],
  targetTimeSeconds: number,
  distanceMeters = 5000,
  anchors: Anchor[] = []
): RacePlan {
 return {
    distanceMeters,
    targetTimeSeconds,
    anchors,
    orderedTrackIds,
  };
}

describe("computePace", () => {
  test("returns seconds per km from distance and target time", () => {
    const p = plan(["a"], 1800, 5000);
    expect(computePace(p)).toBe(360);
  });

  test("returns Infinity when distance is zero or negative", () => {
    expect(computePace(plan(["a"], 100, 0))).toBe(Infinity);
    expect(computePace(plan(["a"], 100, -1))).toBe(Infinity);
  });
});

describe("computeArrangement", () => {
  test("no anchors: contiguous starts from zero", () => {
    const tracks = [track("a", 60), track("b", 90), track("c", 120)];
    const arr = computeArrangement(plan(["a", "b", "c"], 3600, 10000), tracks);
    expect(arr.entries.map((e) => e.startSecond)).toEqual([0, 60, 150]);
    expect(arr.entries.every((e) => e.anchorDeviationSeconds === undefined)).toBe(true);
  });

  test("one anchor: gap before track when target is later than earliest", () => {
    const tracks = [track("a", 60), track("b", 30), track("c", 30)];
    const arr = computeArrangement(
      plan(["a", "b", "c"], 3600, 10000, [{ trackId: "c", targetSecond: 200 }]),
      tracks
    );
    expect(arr.entries[0].startSecond).toBe(0);
    expect(arr.entries[1].startSecond).toBe(60);
    expect(arr.entries[2].startSecond).toBe(200);
    expect(arr.entries[2].anchorDeviationSeconds).toBe(0);
  });

  test("one anchor: target earlier than earliest; start at earliest and positive deviation", () => {
    const tracks = [track("a", 120), track("b", 60)];
    const arr = computeArrangement(
      plan(["a", "b"], 3600, 10000, [{ trackId: "b", targetSecond: 100 }]),
      tracks
    );
    expect(arr.entries[0].startSecond).toBe(0);
    expect(arr.entries[1].startSecond).toBe(120);
    expect(arr.entries[1].anchorDeviationSeconds).toBe(20);
  });

  test("multiple anchors: both exact when feasible", () => {
    const tracks = [track("a", 60), track("b", 60), track("c", 60)];
    const arr = computeArrangement(
      plan(["a", "b", "c"], 500, 10000, [
        { trackId: "a", targetSecond: 10 },
        { trackId: "c", targetSecond: 200 },
      ]),
      tracks
    );
    expect(arr.entries[0].startSecond).toBe(10);
    expect(arr.entries[0].anchorDeviationSeconds).toBe(0);
    expect(arr.entries[1].startSecond).toBe(70);
    expect(arr.entries[2].startSecond).toBe(200);
    expect(arr.entries[2].anchorDeviationSeconds).toBe(0);
  });

  test("impossible pairwise anchors still produce arrangement with deviation", () => {
    const tracks = [track("a", 60), track("b", 60), track("c", 60)];
    const arr = computeArrangement(
      plan(["a", "b", "c"], 500, 10000, [
        { trackId: "a", targetSecond: 0 },
        { trackId: "c", targetSecond: 100 },
      ]),
      tracks
    );
    expect(arr.entries[2].startSecond).toBe(120);
    expect(arr.entries[2].anchorDeviationSeconds).toBe(20);
    const errs = validatePlan(
      plan(["a", "b", "c"], 500, 10000, [
        { trackId: "a", targetSecond: 0 },
        { trackId: "c", targetSecond: 100 },
      ]),
      tracks
    );
    expect(errs.some((e) => e.code === "ANCHOR_CONFLICT")).toBe(true);
  });
});

describe("validatePlan", () => {
  test("total duration shorter than race time", () => {
    const tracks = [track("a", 60), track("b", 60)];
    const errs = validatePlan(plan(["a", "b"], 200), tracks);
    expect(errs.some((e) => e.code === "DURATION_SHORT_OF_RACE")).toBe(true);
  });

  test("total duration longer than race time", () => {
    const tracks = [track("a", 120), track("b", 120)];
    const errs = validatePlan(plan(["a", "b"], 200), tracks);
    expect(errs.some((e) => e.code === "DURATION_EXCEEDS_RACE")).toBe(true);
  });

  test("unknown track in ordered list", () => {
    const tracks = [track("a", 60)];
    const errs = validatePlan(plan(["a", "missing"], 120), tracks);
    expect(errs.some((e) => e.code === "UNKNOWN_TRACK")).toBe(true);
  });

  test("duplicate anchors", () => {
    const tracks = [track("a", 60)];
    const errs = validatePlan(
      plan(["a"], 120, 1000, [
        { trackId: "a", targetSecond: 0 },
        { trackId: "a", targetSecond: 10 },
      ]),
      tracks
    );
    expect(errs.some((e) => e.code === "DUPLICATE_ANCHOR")).toBe(true);
  });
});
