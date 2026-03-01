"use server";

import { AuthTokenType } from "@/app/generated/prisma/enums";
import { generateSecretAndTOTP } from "../totp";
import prisma from "../db";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import z from "zod";
import { sendVerificationEmail } from "./email";

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

  const artist = await prisma.artist.findFirst({
    where: {
      OR: [
        { email: result.data.identifier },
        { username: result.data.identifier },
      ],
    },
    select: {
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

  await prisma.verificationToken.upsert({
    where: {
      target_type: {
        target: artist.email,
        type: AuthTokenType.PASSWORD_RESET,
      },
    },
    update: {
      token,
      secret,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
    create: {
      target: artist.email,
      type: AuthTokenType.PASSWORD_RESET,
      token,
      secret,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
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

  cookieStore.set("dg_verify_type", AuthTokenType.PASSWORD_RESET, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(Date.now() + 15 * 60 * 1000),
  });

  redirect("/verify");
}
