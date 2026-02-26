"use server";

import { AuthTokenType } from "@/app/generated/prisma/enums";
import { getArtist, logout } from "../auth-utils";
import { generateSecretAndTOTP } from "../totp";
import prisma from "../db";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function verifyEmail() {
  const artist = await getArtist();
  if (!artist) {
    return logout();
  }
  const { secret, token } = await generateSecretAndTOTP();

  await prisma.verificationToken.upsert({
    where: {
      target_type: {
        target: artist.email,
        type: AuthTokenType.EMAIL_VERIFICATION,
      },
    },
    update: {
      token,
      secret,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
    create: {
      target: artist.email,
      type: AuthTokenType.EMAIL_VERIFICATION,
      token,
      secret,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  const cookieStore = await cookies();

  cookieStore.set("dg_verify_target", artist.email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(Date.now() + 15 * 60 * 1000),
  });

  cookieStore.set("dg_verify_type", AuthTokenType.EMAIL_VERIFICATION, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(Date.now() + 15 * 60 * 1000),
  });

  console.log(`Verification token for ${artist.email}: ${token}`);

  redirect("/verify");
}
