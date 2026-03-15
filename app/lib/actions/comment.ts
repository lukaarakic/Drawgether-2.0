"use server";

import { revalidatePath } from "next/cache";
import { getArtistId } from "../auth-utils";
import z from "zod";
import { db } from "../db";
import { artworks, comments } from "@/drizzle/schema";
import { eq, sql } from "drizzle-orm";

const CommentSchema = z.object({
  content: z
    .string()
    .min(3, "Comment must be at least 3 characters long.")
    .max(500, "Comment cannot exceed 500 characters."),
});

export async function addCommentAction(
  artworkId: string,
  content: string,
  path: string,
) {
  const loggedInArtist = await getArtistId();

  const validationResult = CommentSchema.safeParse({ content });

  if (!validationResult.success) {
    return { error: validationResult.error.issues[0].message };
  }

  const validContent = validationResult.data.content;

  try {
    await db.transaction(async (tx) => {
      await tx.insert(comments).values({
        content: validContent,
        artistId: loggedInArtist.artistId,
        artworkId,
      });

      await tx
        .update(artworks)
        .set({ commentsCount: sql`${artworks.commentsCount} + 1` })
        .where(eq(artworks.id, artworkId));
    });

    revalidatePath(path);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to post comment. Please try again." };
  }
}

export async function deleteCommentAction(
  commentId: string,
  artworkId: string,
  path: string,
) {
  const loggedInArtist = await getArtistId();

  const comment = await db.query.comments.findFirst({
    where: (comment, { eq }) => eq(comment.id, commentId),
    columns: { artistId: true },
  });

  if (!comment) return { error: "Comment not found" };

  const isOwner = comment.artistId === loggedInArtist.artistId;
  const isAdmin = loggedInArtist.role === "admin";

  if (!isOwner && !isAdmin) return { error: "Unauthorized" };

  try {
    await db.transaction(async (tx) => {
      await tx.delete(comments).where(eq(comments.id, commentId));

      await tx
        .update(artworks)
        .set({ commentsCount: sql`${artworks.commentsCount} - 1` })
        .where(eq(artworks.id, artworkId));
    });

    revalidatePath(path);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to delete comment" };
  }
}
