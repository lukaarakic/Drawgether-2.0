import { db } from "../db";
import { artists } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function getArtistProfileByUsername(username: string) {
  const artist = await db.query.artists.findFirst({
    where: (artist, { eq }) => eq(artist.username, username),
    columns: {
      id: true,
      username: true,
      followerCount: true,
      followingCount: true,
      avatar: true,
    },
    with: {
      artworks: {
        with: {
          artwork: {
            columns: {
              id: true,
              theme: true,
              artworkImage: true,
              likesCount: true,
              createdAt: true,
              updatedAt: true,
              roomId: true,
              commentsCount: true,
            },
            with: {
              comments: {
                columns: { id: true, content: true },
                with: {
                  artist: {
                    columns: { id: true, username: true, avatar: true },
                  },
                },
              },
              artists: {
                with: {
                  artist: {
                    columns: { id: true, username: true, avatar: true },
                  },
                },
              },
            },
          },
        },
      },
      followers: {
        columns: { followerId: true },
      },
    },
  });

  if (!artist) return undefined;

  return {
    ...artist,
    artworks: artist.artworks.map((artworkJoinRow) => ({
      ...artworkJoinRow.artwork,
      artists: artworkJoinRow.artwork.artists.map((joinRow) => joinRow.artist),
    })),
  };
}

export async function getArtistSettingsByUsername(username: string) {
  return db.query.artists.findFirst({
    where: (artist, { eq }) => eq(artist.username, username),
    columns: {
      id: true,
      username: true,
      email: true,
      emailVerified: true,
      avatar: true,
    },
  });
}

export async function searchArtistsByUsername(term: string) {
  return db.query.artists.findMany({
    where: (artist, { ilike }) => ilike(artist.username, `%${term}%`),
    columns: { id: true, username: true, avatar: true },
  });
}

export async function markArtistEmailVerified(artistId: string) {
  await db
    .update(artists)
    .set({ emailVerified: new Date() })
    .where(eq(artists.id, artistId));
}
