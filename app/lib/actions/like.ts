"use server";

import { revalidatePath } from "next/cache";
import { getArtistId } from "../auth-utils";
import prisma from "../db";

export async function likeArtwork(artworkId: string, path: string) {
  const { artistId: id } = await getArtistId();

  const artistId = id;

  try {
    const existingLike = await prisma.like.findFirst({
      where: {
        artworkId,
        artistId,
      },
      select: {
        artistId: true,
      },
    });

    const alreadyLiked = !!existingLike;

    await prisma.$transaction([
      alreadyLiked
        ? prisma.like.delete({
            where: { artistId_artworkId: { artistId, artworkId } },
          })
        : prisma.like.create({ data: { artistId, artworkId } }),

      prisma.artwork.update({
        where: { id: artworkId },
        data: {
          likesCount: {
            [alreadyLiked ? "decrement" : "increment"]: 1,
          },
        },
      }),
    ]);

    revalidatePath(path);

    return { success: true, liked: !alreadyLiked };
  } catch (err) {
    console.error("Error toggling like:", err);
    return { success: false, error: "Failed to toggle like" };
  }
}
