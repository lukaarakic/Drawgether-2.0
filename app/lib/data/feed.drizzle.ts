import { db } from "../db";
import { getLikedArtworkIds } from "./interactions.drizzle";

export type FeedComment = {
  id: string;
  content: string;
  artist: {
    id: string;
    username: string;
  };
};

export type FeedArtwork = {
  id: string;
  theme: string;
  artworkImage: string;
  likesCount: number;
  commentsCount: number;
  roomId: string | null;
  createdAt: Date;
  updatedAt: Date;
  artists: {
    id: string;
    username: string;
    avatar: string | null;
  }[];
  comments: FeedComment[];
};

export type FeedCursor = {
  createdAt: string;
  id: string;
};

export async function getFeedChunk({
  artistId,
  cursor,
  limit,
}: {
  artistId: string;
  cursor?: FeedCursor | null;
  limit: number;
}): Promise<{
  artworks: FeedArtwork[];
  likedArtworkIds: string[];
  hasMore: boolean;
  nextCursor: FeedCursor | null;
}> {
  const requestedLimit = Math.max(1, Math.min(limit, 20));
  const cursorDate = cursor?.createdAt ? new Date(cursor.createdAt) : null;
  const cursorId = cursor?.id ?? null;

  const artworks = await db.query.artworks.findMany({
    where:
      cursorDate && cursorId
        ? (artwork, { or, and, lt, eq }) =>
            or(
              lt(artwork.createdAt, cursorDate),
              and(eq(artwork.createdAt, cursorDate), lt(artwork.id, cursorId)),
            )
        : undefined,
    with: {
      artists: {
        with: {
          artist: {
            columns: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      },
      comments: {
        with: {
          artist: {
            columns: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      },
    },
    orderBy: (artwork, { desc }) => [desc(artwork.createdAt), desc(artwork.id)],
    limit: requestedLimit + 1,
  });

  const hasMore = artworks.length > requestedLimit;
  const chunk = artworks.slice(0, requestedLimit);
  const lastArtwork = chunk.at(-1);

  const formattedArtworks: FeedArtwork[] = chunk.map((artwork) => ({
    ...artwork,
    artists: artwork.artists.map((joinRow) => joinRow.artist),
  }));

  if (!formattedArtworks.length) {
    return {
      artworks: [],
      likedArtworkIds: [],
      hasMore,
      nextCursor: null,
    };
  }

  const likedArtworkIds = await getLikedArtworkIds({
    artistId,
    artworkIds: formattedArtworks.map((a) => a.id),
  });

  return {
    artworks: formattedArtworks,
    likedArtworkIds,
    hasMore,
    nextCursor:
      hasMore && lastArtwork
        ? {
            createdAt: lastArtwork.createdAt.toISOString(),
            id: lastArtwork.id,
          }
        : null,
  };
}
