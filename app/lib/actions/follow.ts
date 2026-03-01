"use server";

import { revalidatePath } from "next/cache";
import { getArtistId } from "../auth-utils";
import prisma from "../db";

export default async function followAction(
  targetArtistId: string,
  path: string,
) {
  const currentArtist = await getArtistId();

  if (currentArtist.artistId === targetArtistId) {
    return null;
  }

  const existingFollow = await prisma.follows.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentArtist.artistId,
        followingId: targetArtistId,
      },
    },
  });

  if (existingFollow) {
    try {
      await prisma.$transaction([
        prisma.follows.delete({
          where: {
            followerId_followingId: {
              followerId: currentArtist.artistId,
              followingId: targetArtistId,
            },
          },
        }),

        prisma.artist.update({
          where: { id: targetArtistId },
          data: { followerCount: { decrement: 1 } },
        }),
        prisma.artist.update({
          where: { id: currentArtist.artistId },
          data: { followingCount: { decrement: 1 } },
        }),
      ]);
    } catch (error) {
      throw error;
    }
  } else {
    try {
      await prisma.$transaction([
        prisma.follows.create({
          data: {
            followerId: currentArtist.artistId,
            followingId: targetArtistId,
          },
        }),
        prisma.artist.update({
          where: { id: targetArtistId },
          data: { followerCount: { increment: 1 } },
        }),
        prisma.artist.update({
          where: { id: currentArtist.artistId },
          data: { followingCount: { increment: 1 } },
        }),
      ]);
    } catch (error) {
      throw error;
    }
  }

  revalidatePath(path);
}
