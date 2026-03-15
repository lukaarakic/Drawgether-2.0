"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getArtistId } from "../auth-utils";
import { db } from "../db";
import { artworks, likes } from "@/drizzle/schema";

export async function likeArtwork(artworkId: string, path: string) {
  const { artistId: id } = await getArtistId();

  const artistId = id;

  try {
    const existingLike = await db.query.likes.findFirst({
      where: (like, { and, eq }) =>
        and(eq(like.artworkId, artworkId), eq(like.artistId, artistId)),
      columns: {
        artistId: true,
      },
    });

    const alreadyLiked = !!existingLike;

    await db.transaction(async (tx) => {
      if (alreadyLiked) {
        await tx
          .delete(likes)
          .where(
            and(eq(likes.artworkId, artworkId), eq(likes.artistId, artistId)),
          );

        await tx
          .update(artworks)
          .set({ likesCount: sql`${artworks.likesCount} - 1` })
          .where(eq(artworks.id, artworkId));

        return;
      }

      await tx.insert(likes).values({ artistId, artworkId });

      await tx
        .update(artworks)
        .set({ likesCount: sql`${artworks.likesCount} + 1` })
        .where(eq(artworks.id, artworkId));
    });

    revalidatePath(path);

    return { success: true, liked: !alreadyLiked };
  } catch (err) {
    console.error("Error toggling like:", err);
    return { success: false, error: "Failed to toggle like" };
  }
}
