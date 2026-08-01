"use server";

import { AuthTokenType } from "@/drizzle/types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import z from "zod";
import { validateHoneypot } from "../security";
import { signJWT } from "../jwt";
import {
  deleteVerificationToken,
  findArtistByEmailOrUsername,
  findVerificationToken,
} from "../data/auth";
import { markArtistEmailVerified } from "../data/artists";

const VerifySchema = z.object({
  token: z.string().length(6, "Code must be 6 digits"),
});

export type VerifyState = {
  errors: { token?: string[] };
  message?: string;
};

export async function verifyTOTPAction(
  prevState: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  if (!validateHoneypot(formData))
    return {
      errors: {},
      message: "Unknown error occurred. Please try again.",
    };

  const cookieStore = await cookies();
  const verifyTarget = cookieStore.get("dg_verify_target")?.value;
  const verifyType = cookieStore.get("dg_verify_type")?.value;

  if (!verifyTarget || !verifyType) {
    return {
      errors: {},
      message: "Session expired. Please try again.",
    };
  }

  const result = VerifySchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      message: "Please check the code and try again.",
    };
  }

  const verificationToken = await findVerificationToken(
    verifyTarget,
    AuthTokenType[verifyType as keyof typeof AuthTokenType],
  );

  if (!verificationToken) {
    return { errors: {}, message: "No active verification request found." };
  }
  if (verificationToken.token !== result.data.token) {
    return {
      errors: {},
      message: "Invalid code. Please try again.",
    };
  }
  if (new Date(Date.now()) > verificationToken.expiresAt) {
    return {
      errors: {},
      message: "Code has expired. Please request a new one.",
    };
  }

  const artist = await findArtistByEmailOrUsername(verifyTarget);

  if (!artist) {
    return { errors: {}, message: "Account not found." };
  }

  await deleteVerificationToken(verificationToken.id);

  cookieStore.delete("dg_verify_target");
  cookieStore.delete("dg_verify_type");

  if (verifyType === AuthTokenType.EMAIL_VERIFICATION) {
    await markArtistEmailVerified(artist.id);

    redirect(`/artist/${artist.username}`);
  }

  if (verifyType === AuthTokenType.PASSWORD_RESET) {
    const resetToken = await signJWT(
      { sub: artist.id, role: "password-reset" },
      "15m",
    );

    cookieStore.set("dg_reset_token", resetToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(Date.now() + 15 * 60 * 1000),
    });

    redirect("/reset-password");
  }

  return { errors: {}, message: "Verification successful." };
}
