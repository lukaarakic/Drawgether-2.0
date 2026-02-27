"use server";

import { revalidatePath } from "next/cache";
import { getArtistId } from "../auth-utils";
import prisma from "../db";

export async function deleteArtworkAction(artworkId: string, path: string) {
  const loggedInArtist = await getArtistId();

  const artwork = await prisma.artwork.findUnique({
    where: { id: artworkId },
    select: {
      artists: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!artwork) return { error: "Artwork not found" };

  const isOwner = artwork.artists.some(
    (artist) => artist.id === loggedInArtist.artistId,
  );

  const isAdmin = loggedInArtist.role === "admin";

  if (!isOwner && !isAdmin) return { error: "Unauthorized" };

  await prisma.artwork.delete({
    where: { id: artworkId },
  });

  revalidatePath(path);
  return { success: true };
}
