"use server";

import { revalidatePath } from "next/cache";
import { getArtistId } from "../auth-utils";
import prisma from "../db";
import z from "zod";

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
    await prisma.$transaction([
      prisma.comment.create({
        data: {
          content: validContent,
          artistId: loggedInArtist.artistId,
          artworkId,
        },
      }),
      prisma.artwork.update({
        where: { id: artworkId },
        data: { commentsCount: { increment: 1 } },
      }),
    ]);

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

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { artistId: true },
  });

  if (!comment) return { error: "Comment not found" };

  const isOwner = comment.artistId === loggedInArtist.artistId;
  const isAdmin = loggedInArtist.role === "admin";

  if (!isOwner && !isAdmin) return { error: "Unauthorized" };

  try {
    await prisma.$transaction([
      prisma.comment.delete({
        where: { id: commentId },
      }),

      prisma.artwork.update({
        where: { id: artworkId },
        data: { commentsCount: { decrement: 1 } },
      }),
    ]);

    revalidatePath(path);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to delete comment" };
  }
}
