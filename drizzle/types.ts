import { artists, artworks, comments } from "./schema";

export type Artist = typeof artists.$inferSelect;
export type Artwork = typeof artworks.$inferSelect;
export type Comment = typeof comments.$inferSelect;

export type ArtworkComment = Pick<Comment, "id" | "content"> & {
  artist: Pick<Artist, "id" | "username">;
};

export type ArtworkWithArtists = Artwork & {
  artists: Pick<Artist, "id" | "username" | "avatar">[];
  comments: ArtworkComment[];
};

export type ArtistWithArtworks = Pick<Artist, "id" | "username" | "avatar"> & {
  artworks: Pick<Artwork, "id" | "artworkImage">[];
};

export const RoomStatus = {
  WAITING: "WAITING",
  STARTING: "STARTING",
  ACTIVE: "ACTIVE",
  FINISHED: "FINISHED",
} as const;

export type RoomStatus = (typeof RoomStatus)[keyof typeof RoomStatus];

export const AuthTokenType = {
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  PASSWORD_RESET: "PASSWORD_RESET",
} as const;
