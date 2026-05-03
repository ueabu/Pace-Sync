/** One sample along the course: cumulative distance (m) and elevation (m). */
export type CourseProfilePoint = {
  distanceM: number;
  elevationM: number;
};

/** Parsed GPX / course geometry for optional elevation UI. */
export type CourseProfile = {
  points: CourseProfilePoint[];
  totalDistanceM: number;
  /** Sum of positive vertical gain between consecutive points (m), if computed. */
  totalAscentM?: number;
};

/** Minimal race plan for aligning the elevation chart with the timeline. */
export type RacePlan = {
  /** Total race distance in meters. */
  distanceM: number;
  /** Target finish time in seconds. */
  targetSeconds: number;
};

/** Block on the timeline: start position by distance into the race. */
export type TimelineSongBlock = {
  id: string;
  title: string;
  /** Distance from race start where this block begins (m). */
  distanceMStart: number;
  /** Block width as a distance span (m), optional for labels only. */
  distanceMWidth?: number;
};
