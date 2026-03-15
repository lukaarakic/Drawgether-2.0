"use server";

import { cookies } from "next/headers";
import z from "zod";
import { getPasswordHash } from "../auth-utils";
import { redirect } from "next/navigation";
import { db } from "../db";
import { artists, passwords } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

const ResetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long"),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
  });

export type ResetPasswordState = {
  errors: { newPassword?: string[]; confirmPassword?: string[] };
  message?: string;
};

export async function resetPassword(
  prevState: ResetPasswordState,
  formData: FormData,
) {
  const result = ResetPasswordSchema.safeParse({
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      message: "",
    };
  }

  const cookieStore = await cookies();
  const artistUsername = cookieStore.get("dg_reset_artist_username")?.value;

  if (!artistUsername) {
    return {
      errors: {},
      message:
        "No artist information found. Please restart the password reset process.",
    };
  }

  const hash = await getPasswordHash(result.data.newPassword);

  try {
    const updatedArtist = await db
      .update(passwords)
      .set({
        hash,
      })
      .where(
        eq(
          passwords.artistId,
          db
            .select({ id: artists.id })
            .from(artists)
            .where(eq(artists.username, artistUsername))
            .limit(1),
        ),
      )
      .returning({ id: passwords.artistId });

    if (!updatedArtist) {
      return {
        errors: {},
        message: "Failed to update password. Please try again.",
      };
    }
  } catch (err) {
    console.error(err);
    return {
      errors: {},
      message: "Failed to update password. Please try again.",
    };
  }

  cookieStore.delete("dg_reset_artist_username");
  redirect("/login");
}
