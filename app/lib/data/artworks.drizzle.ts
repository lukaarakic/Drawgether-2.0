import { db } from "../db";
import { artistsArtworks, artworks } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function createArtworkForRoom({
  roomDatabaseId,
  theme,
  artworkImage,
  artistIds,
}: {
  roomDatabaseId: string;
  theme: string;
  artworkImage: string;
  artistIds: string[];
}) {
  return db.transaction(async (tx) => {
    const [createdArtwork] = await tx
      .insert(artworks)
      .values({ artworkImage, roomId: roomDatabaseId, theme })
      .returning();

    if (artistIds.length > 0) {
      await tx.insert(artistsArtworks).values(
        artistIds.map((artistId) => ({
          artworkId: createdArtwork.id,
          artistId,
        })),
      );
    }

    return createdArtwork;
  });
}

const artworkWithArtistsAndCommentsShape = {
  artists: {
    with: {
      artist: {
        columns: { id: true, username: true, avatar: true } as const,
      },
    },
  },
  comments: {
    columns: { id: true, content: true } as const,
    with: {
      artist: {
        columns: { id: true, username: true, avatar: true } as const,
      },
    },
  },
} as const;

export async function getArtworkWithArtistsAndComments(artworkId: string) {
  const artwork = await db.query.artworks.findFirst({
    where: (artwork, { eq }) => eq(artwork.id, artworkId),
    with: artworkWithArtistsAndCommentsShape,
  });

  if (!artwork) return undefined;

  return { ...artwork, artists: artwork.artists.map((joinRow) => joinRow.artist) };
}

export async function getArtworkWithArtistsCommentsAndLikes(artworkId: string) {
  const artwork = await db.query.artworks.findFirst({
    where: (artwork, { eq }) => eq(artwork.id, artworkId),
    with: {
      ...artworkWithArtistsAndCommentsShape,
      likes: { columns: { artistId: true } },
    },
  });

  if (!artwork) return undefined;

  return { ...artwork, artists: artwork.artists.map((joinRow) => joinRow.artist) };
}

export async function getArtworkCommentsOnly(artworkId: string) {
  return db.query.artworks.findFirst({
    where: (artwork, { eq }) => eq(artwork.id, artworkId),
    columns: { id: true },
    with: {
      comments: {
        columns: { id: true, content: true },
        with: {
          artist: { columns: { id: true, username: true, avatar: true } },
        },
      },
    },
  });
}

export async function getArtworkOwnerIds(artworkId: string) {
  const artwork = await db.query.artworks.findFirst({
    where: (artwork, { eq }) => eq(artwork.id, artworkId),
    with: {
      artists: { columns: { artistId: true } },
    },
  });

  if (!artwork) return null;

  return artwork.artists.map((a) => a.artistId);
}

export async function deleteArtworkById(artworkId: string) {
  await db.delete(artworks).where(eq(artworks.id, artworkId));
}
