export type Track = {
  id: string;
  name: string;
  artists: string[];
  durationMs: number;
};

export type PlaylistSummary = {
  id: string;
  name: string;
  images?: { url: string }[];
  tracksTotal?: number;
  /** Whether the playlist is public (when known). */
  public?: boolean;
};
