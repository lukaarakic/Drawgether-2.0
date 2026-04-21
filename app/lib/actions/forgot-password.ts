"use server";

import { generateSecretAndTOTP } from "../totp";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import z from "zod";
import { sendVerificationEmail } from "./email";
import { db } from "../db";
import { authTokenTypeEnum, verificationTokens } from "@/drizzle/schema";

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

  const artist = await db.query.artists.findFirst({
    where: (artist, { eq, or }) =>
      or(
        eq(artist.email, result.data.identifier),
        eq(artist.username, result.data.identifier),
      ),
    columns: {
      id: true,
      email: true,
      username: true,
    },
  });

  if (!artist) {
    return {
      errors: { identifier: ["No artist found with that username or email"] },
      message: "",
    };
  }

  const { secret, token } = await generateSecretAndTOTP();

  const newExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db
    .insert(verificationTokens)
    .values({
      target: artist.email,
      type: authTokenTypeEnum.enumValues[1],
      token,
      secret,
      expiresAt: newExpiresAt,
    })
    .onConflictDoUpdate({
      target: [verificationTokens.target, verificationTokens.type],
      set: {
        token,
        secret,
        expiresAt: newExpiresAt,
      },
    });

  await sendVerificationEmail(artist.email, token, "reset", artist.username);

  const cookieStore = await cookies();

  cookieStore.set("dg_verify_target", artist.email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(Date.now() + 15 * 60 * 1000),
  });

  cookieStore.set("dg_verify_type", authTokenTypeEnum.enumValues[1], {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(Date.now() + 15 * 60 * 1000),
  });

  redirect("/verify");
}
