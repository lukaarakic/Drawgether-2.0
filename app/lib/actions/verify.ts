"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "../db";
import z from "zod";
import { AuthTokenType } from "@/app/generated/prisma/enums";
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

  const verificationToken = await prisma.verificationToken.findUnique({
    where: {
      target_type: {
        target: verifyTarget,
        type: AuthTokenType[verifyType as keyof typeof AuthTokenType],
      },
    },
  });

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

  const artist = await prisma.artist.findFirst({
    where: {
      OR: [{ email: verifyTarget }, { username: verifyTarget }],
    },
    select: { id: true, email: true, username: true },
  });

  if (!artist) {
    return { errors: {}, message: "Account not found." };
  }

  await prisma.verificationToken.delete({
    where: { id: verificationToken.id },
  });

  cookieStore.delete("dg_verify_target");
  cookieStore.delete("dg_verify_type");

  if (verifyType === AuthTokenType.EMAIL_VERIFICATION) {
    await prisma.artist.update({
      where: { id: artist.id },
      data: { emailVerified: new Date() },
    });

    redirect(`/artist/${artist.username}`);
  }

  if (verifyType === AuthTokenType.PASSWORD_RESET) {
    cookieStore.set("dg_reset_artist_username", artist.username, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(Date.now() + 15 * 60 * 1000),
    });

    redirect("/reset-password");
  }

  return { errors: {}, message: "Verification successful." };
}
