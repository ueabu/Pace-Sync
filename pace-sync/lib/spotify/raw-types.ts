export type SpotifyImage = {
  url: string;
  height?: number | null;
  width?: number | null;
};

export type SpotifyPaging<T> = {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
};

export type SpotifyTracksRef = {
  href: string;
  total: number;
};

export type SpotifyPlaylistSimplified = {
  collaborative?: boolean;
  description?: string | null;
  external_urls?: Record<string, string>;
  href: string;
  id: string;
  images?: SpotifyImage[];
  name: string;
  owner?: { display_name?: string; id?: string };
  public?: boolean;
  snapshot_id?: string;
  tracks?: SpotifyTracksRef;
  type: string;
  uri: string;
};

export type SpotifyPlaylistPage =
  SpotifyPaging<SpotifyPlaylistSimplified>;

export type SpotifyArtistSimplified = {
  name: string;
  id?: string;
};

/** Track object subset from playlist items & search. */
export type SpotifyTrackObject = {
  type?: string;
  id: string | null;
  uri?: string;
  name?: string;
  duration_ms?: number;
  artists?: SpotifyArtistSimplified[];
  album?: {
    id?: string;
    name?: string;
    images?: SpotifyImage[];
  };
  is_local?: boolean;
};

export type SpotifyPlaylistTrackItem = {
  added_at?: string;
  added_by?: Record<string, unknown>;
  track: SpotifyTrackObject | null;
};

export type SpotifyPlaylistTracksPage =
  SpotifyPaging<SpotifyPlaylistTrackItem>;

export type SpotifySearchTracksPage = {
  tracks?: SpotifyPaging<SpotifyTrackObject>;
};
