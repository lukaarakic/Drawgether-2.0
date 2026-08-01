"use server";

import { generateSecretAndTOTP } from "../totp";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import z from "zod";
import { sendVerificationEmail } from "./email";
import { findArtistByEmailOrUsername, upsertVerificationToken } from "../data/auth";
import { AuthTokenType } from "@/drizzle/types";

export type ForgotPasswordState = {
  errors: { identifier?: string[] };
  message?: string;
};

const ForgotPasswordSchema = z.object({
  identifier: z.string().min(1, "Username or email is required"),
});

export async function ForgotPasswordAction(
  prevState: ForgotPasswordState,
  formData: FormData,
) {
  const result = ForgotPasswordSchema.safeParse({
    identifier: formData.get("identifier") as string,
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      message: "Invalid input",
    };
  }

  const artist = await findArtistByEmailOrUsername(result.data.identifier);

  if (!artist) {
    return {
      errors: { identifier: ["No artist found with that username or email"] },
      message: "",
    };
  }

  const { secret, token } = await generateSecretAndTOTP();

  const newExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await upsertVerificationToken({
    target: artist.email,
    type: AuthTokenType.PASSWORD_RESET,
    token,
    secret,
    expiresAt: newExpiresAt,
  });

  await sendVerificationEmail(artist.email, token, "reset", artist.username);

  const cookieStore = await cookies();

  cookieStore.set("dg_verify_target", artist.email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(Date.now() + 15 * 60 * 1000),
  });

  cookieStore.set("dg_verify_type", AuthTokenType.PASSWORD_RESET, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(Date.now() + 15 * 60 * 1000),
  });

  redirect("/verify");
}
