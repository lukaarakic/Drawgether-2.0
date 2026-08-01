"use server";

import { revalidatePath } from "next/cache";
import { getArtistId } from "../auth-utils";
import { deleteArtworkById, getArtworkOwnerIds } from "../data/artworks";

export async function deleteArtworkAction(artworkId: string, path: string) {
  const loggedInArtist = await getArtistId();

  const ownerIds = await getArtworkOwnerIds(artworkId);

  if (!ownerIds) return { error: "Artwork not found" };

  const isOwner = ownerIds.includes(loggedInArtist.artistId);
  const isAdmin = loggedInArtist.role === "admin";

  if (!isOwner && !isAdmin) return { error: "Unauthorized" };

  await deleteArtworkById(artworkId);

  revalidatePath(path);
  return { success: true };
}
