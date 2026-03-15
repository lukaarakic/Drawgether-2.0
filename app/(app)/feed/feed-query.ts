import { db } from "@/app/lib/db";

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

  const artistLikes = await db.query.likes.findMany({
    where: (likes, { and, eq, inArray }) =>
      and(
        eq(likes.artistId, artistId),
        inArray(
          likes.artworkId,
          formattedArtworks.map((a) => a.id),
        ),
      ),
    columns: {
      artworkId: true,
    },
  });

  return {
    artworks: formattedArtworks,
    likedArtworkIds: artistLikes.map((like) => like.artworkId),
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
