"use server";

import { revalidatePath } from "next/cache";
import { getArtistId } from "../auth-utils";
import { db } from "../db";
import { artists, follows } from "@/drizzle/schema";
import { and, eq, sql } from "drizzle-orm";

export default async function followAction(
  targetArtistId: string,
  path: string,
) {
  const currentArtist = await getArtistId();

  if (currentArtist.artistId === targetArtistId) {
    return null;
  }

  const existingFollow = await db.query.follows.findFirst({
    where: (follow, { eq, and }) =>
      and(
        eq(follow.followerId, currentArtist.artistId),
        eq(follow.followingId, targetArtistId),
      ),
  });

  if (existingFollow) {
    try {
      await db.transaction(async (tx) => {
        await tx
          .delete(follows)
          .where(
            and(
              eq(follows.followerId, currentArtist.artistId),
              eq(follows.followingId, targetArtistId),
            ),
          );

        await tx
          .update(artists)
          .set({ followerCount: sql`${artists.followerCount} - 1` })
          .where(eq(artists.id, targetArtistId));

        await tx
          .update(artists)
          .set({ followingCount: sql`${artists.followingCount} - 1` })
          .where(eq(artists.id, currentArtist.artistId));
      });
    } catch (error) {
      throw error;
    }
  } else {
    try {
      await db.transaction(async (tx) => {
        await tx.insert(follows).values({
          followerId: currentArtist.artistId,
          followingId: targetArtistId,
        });

        await tx
          .update(artists)
          .set({ followerCount: sql`${artists.followerCount} + 1` })
          .where(eq(artists.id, targetArtistId));
        await tx
          .update(artists)
          .set({ followingCount: sql`${artists.followingCount} + 1` })
          .where(eq(artists.id, currentArtist.artistId));
      });
    } catch (error) {
      throw error;
    }
  }

  revalidatePath(path);
}
