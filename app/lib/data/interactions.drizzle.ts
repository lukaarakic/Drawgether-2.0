import { db } from "../db";
import { artists, artworks, comments, follows, likes } from "@/drizzle/schema";
import { and, eq, sql } from "drizzle-orm";

export async function getLikedArtworkIds({
  artistId,
  artworkIds,
}: {
  artistId: string;
  artworkIds: string[];
}): Promise<string[]> {
  if (artworkIds.length === 0) return [];

  const rows = await db.query.likes.findMany({
    where: (like, { and, eq, inArray }) =>
      and(eq(like.artistId, artistId), inArray(like.artworkId, artworkIds)),
    columns: { artworkId: true },
  });

  return rows.map((row) => row.artworkId);
}

export async function isArtworkLikedByArtist(artistId: string, artworkId: string) {
  const existing = await db.query.likes.findFirst({
    where: (like, { and, eq }) =>
      and(eq(like.artworkId, artworkId), eq(like.artistId, artistId)),
    columns: { artistId: true },
  });

  return !!existing;
}

export async function toggleArtworkLike({
  artistId,
  artworkId,
}: {
  artistId: string;
  artworkId: string;
}): Promise<{ liked: boolean; likeCount: number }> {
  const alreadyLiked = await isArtworkLikedByArtist(artistId, artworkId);
  let likeCount = 0;

  await db.transaction(async (tx) => {
    if (alreadyLiked) {
      await tx
        .delete(likes)
        .where(and(eq(likes.artworkId, artworkId), eq(likes.artistId, artistId)));

      const [updated] = await tx
        .update(artworks)
        .set({ likesCount: sql`${artworks.likesCount} - 1` })
        .where(eq(artworks.id, artworkId))
        .returning({ likesCount: artworks.likesCount });
      likeCount = updated.likesCount;

      return;
    }

    await tx.insert(likes).values({ artistId, artworkId });

    const [updated] = await tx
      .update(artworks)
      .set({ likesCount: sql`${artworks.likesCount} + 1` })
      .where(eq(artworks.id, artworkId))
      .returning({ likesCount: artworks.likesCount });
    likeCount = updated.likesCount;
  });

  return { liked: !alreadyLiked, likeCount };
}

export async function findFollow(followerId: string, followingId: string) {
  return db.query.follows.findFirst({
    where: (follow, { eq, and }) =>
      and(eq(follow.followerId, followerId), eq(follow.followingId, followingId)),
  });
}

export async function toggleFollow({
  followerId,
  followingId,
}: {
  followerId: string;
  followingId: string;
}) {
  const existingFollow = await findFollow(followerId, followingId);

  if (existingFollow) {
    await db.transaction(async (tx) => {
      await tx
        .delete(follows)
        .where(
          and(
            eq(follows.followerId, followerId),
            eq(follows.followingId, followingId),
          ),
        );

      await tx
        .update(artists)
        .set({ followerCount: sql`${artists.followerCount} - 1` })
        .where(eq(artists.id, followingId));

      await tx
        .update(artists)
        .set({ followingCount: sql`${artists.followingCount} - 1` })
        .where(eq(artists.id, followerId));
    });

    return { following: false };
  }

  await db.transaction(async (tx) => {
    await tx.insert(follows).values({ followerId, followingId });

    await tx
      .update(artists)
      .set({ followerCount: sql`${artists.followerCount} + 1` })
      .where(eq(artists.id, followingId));

    await tx
      .update(artists)
      .set({ followingCount: sql`${artists.followingCount} + 1` })
      .where(eq(artists.id, followerId));
  });

  return { following: true };
}

export async function getCommentOwnerId(commentId: string) {
  return db.query.comments.findFirst({
    where: (comment, { eq }) => eq(comment.id, commentId),
    columns: { artistId: true },
  });
}

export async function addComment({
  content,
  artistId,
  artworkId,
}: {
  content: string;
  artistId: string;
  artworkId: string;
}) {
  await db.transaction(async (tx) => {
    await tx.insert(comments).values({ content, artistId, artworkId });

    await tx
      .update(artworks)
      .set({ commentsCount: sql`${artworks.commentsCount} + 1` })
      .where(eq(artworks.id, artworkId));
  });
}

export async function deleteComment({
  commentId,
  artworkId,
}: {
  commentId: string;
  artworkId: string;
}) {
  await db.transaction(async (tx) => {
    await tx.delete(comments).where(eq(comments.id, commentId));

    await tx
      .update(artworks)
      .set({ commentsCount: sql`${artworks.commentsCount} - 1` })
      .where(eq(artworks.id, artworkId));
  });
}
