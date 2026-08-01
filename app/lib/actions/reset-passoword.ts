"use server";

import { cookies } from "next/headers";
import z from "zod";
import { getPasswordHash } from "../auth-utils";
import { redirect } from "next/navigation";
import { updateArtistPasswordHash } from "../data/auth";
import { verifyJWT } from "../jwt";

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
  const resetToken = cookieStore.get("dg_reset_token")?.value;
  const payload = resetToken ? await verifyJWT(resetToken) : null;

  if (!payload || payload.role !== "password-reset") {
    return { errors: {}, message: "Session expired. Please restart reset." };
  }

  const hash = await getPasswordHash(result.data.newPassword);

  try {
    const updatedArtist = await updateArtistPasswordHash(payload.sub, hash);

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

  cookieStore.delete("dg_reset_token");
  redirect("/login");
}
