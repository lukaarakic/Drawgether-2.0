"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getArtistId } from "../auth-utils";
import { db } from "../db";
import { artworks } from "@/drizzle/schema";

export async function deleteArtworkAction(artworkId: string, path: string) {
  const loggedInArtist = await getArtistId();

  const artwork = await db.query.artworks.findFirst({
    where: (artwork, { eq }) => eq(artwork.id, artworkId),
    with: {
      artists: {
        columns: {
          artistId: true,
        },
      },
    },
  });

  if (!artwork) return { error: "Artwork not found" };

  const isOwner = artwork.artists.some(
    (artist) => artist.artistId === loggedInArtist.artistId,
  );

  const isAdmin = loggedInArtist.role === "admin";

  if (!isOwner && !isAdmin) return { error: "Unauthorized" };

  await db.delete(artworks).where(eq(artworks.id, artworkId));

  revalidatePath(path);
  return { success: true };
}
