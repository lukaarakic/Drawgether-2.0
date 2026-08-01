"use server";

import { getArtist } from "../auth-utils";
import { generateSecretAndTOTP } from "../totp";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { sendVerificationEmail } from "./email";
import { upsertVerificationToken } from "../data/auth";
import { AuthTokenType } from "@/drizzle/types";
import { logoutAction } from "./logout";

export async function verifyEmail() {
  const artist = await getArtist();
  if (!artist) {
    return logoutAction();
  }
  const { secret, token } = await generateSecretAndTOTP();

  const newExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await upsertVerificationToken({
    target: artist.email,
    type: AuthTokenType.EMAIL_VERIFICATION,
    token,
    secret,
    expiresAt: newExpiresAt,
  });

  await sendVerificationEmail(
    artist.email,
    token,
    "verification",
    artist.username,
  );

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

  redirect("/verify");
}
