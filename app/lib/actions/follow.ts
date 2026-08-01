"use server";

import { revalidatePath } from "next/cache";
import { getArtistId } from "../auth-utils";
import { toggleFollow } from "../data/interactions";

export default async function followAction(
  targetArtistId: string,
  path: string,
) {
  const currentArtist = await getArtistId();

  if (currentArtist.artistId === targetArtistId) {
    return null;
  }

  await toggleFollow({
    followerId: currentArtist.artistId,
    followingId: targetArtistId,
  });

  revalidatePath(path);
}
