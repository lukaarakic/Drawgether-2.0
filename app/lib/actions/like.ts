"use server";

import { revalidatePath } from "next/cache";
import { getArtistId } from "../auth-utils";
import { toggleArtworkLike } from "../data/interactions";

export async function likeArtwork(artworkId: string, path: string) {
  const { artistId } = await getArtistId();

  try {
    const { liked, likeCount } = await toggleArtworkLike({ artistId, artworkId });

    revalidatePath(path);

    return { success: true, liked, likeCount };
  } catch (err) {
    console.error("Error toggling like:", err);
    return { success: false, error: "Failed to toggle like" };
  }
}
