"use server";

import { AuthTokenType } from "@/app/generated/prisma/enums";
import { getArtist, logout } from "../auth-utils";
import { generateSecretAndTOTP } from "../totp";
import prisma from "../db";
import { redirect } from "next/navigation";

export async function verifyEmail() {
  const artist = await getArtist();
  if (!artist) {
    return logout();
  }
  const { secret, token } = await generateSecretAndTOTP();

  await prisma.verificationToken.create({
    data: {
      type: AuthTokenType.EMAIL_VERIFICATION,
      target: artist.email,
      token,
      secret,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  console.log(`Verification token for ${artist.email}: ${token}`);

  redirect("/verify");
}
