"use server";

import {
  EmailSchema,
  PasswordSchema,
  UsernameSchema,
} from "@/app/utils/user-validation";
import z from "zod";
import { getPasswordHash } from "../auth-utils";
import { signJWT } from "../jwt";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateHoneypot } from "../security";
import { db } from "../db";
import { artists, passwords } from "@/drizzle/schema";

export type AuthState = {
  errors: { username?: string[]; email?: string[]; password?: string[] };
  message?: string;
};

const RegisterSchema = z
  .object({
    username: UsernameSchema,
    email: EmailSchema,
    password: PasswordSchema,
    rememberMe: z
      .literal("on")
      .optional()
      .transform((val) => val === "on"),
  })
  .superRefine(async (data, ctx) => {
    const [existingUsername, existingEmail] = await Promise.all([
      db.query.artists.findFirst({
        where: (artist, { eq }) => eq(artist.username, data.username),
        columns: { id: true },
      }),
      db.query.artists.findFirst({
        where: (artist, { eq }) => eq(artist.email, data.email),
        columns: { id: true },
      }),
    ]);

    if (existingUsername) {
      ctx.addIssue({
        code: "custom",
        message: "Username is already taken",
        path: ["username"],
      });
    }

    if (existingEmail) {
      ctx.addIssue({
        code: "custom",
        message: "Email is already registered",
        path: ["email"],
      });
    }
  });

export async function registerAction(
  prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!validateHoneypot(formData))
    return {
      errors: {},
      message: "Unkown error occurred. Please try again.",
    };

  const data = Object.fromEntries(formData.entries());
  const result = await RegisterSchema.safeParseAsync(data);

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      message: "Something went wrong",
    };
  }

  try {
    const hashedPassword = await getPasswordHash(result.data.password);

    const userRole = await db.query.roles.findFirst({
      where: (role, { eq }) => eq(role.name, "user"),
      columns: { id: true, name: true },
    });

    if (!userRole) {
      return {
        errors: {},
        message: "Role configuration error. Please contact support.",
      };
    }

    const [createdArtist] = await db
      .insert(artists)
      .values({
        username: result.data.username,
        email: result.data.email,
        roleId: userRole.id,
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(result.data.username)}`,
      })
      .returning({ id: artists.id });

    await db.insert(passwords).values({
      artistId: createdArtist.id,
      hash: hashedPassword,
    });

    const token = await signJWT(
      { sub: createdArtist.id, role: userRole.name },
      result.data.rememberMe ? "30d" : "24h",
    );

    const maxAge = 60 * 60 * 24 * 30;

    const cookieStore = await cookies();
    cookieStore.set("dg_session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      expires: result.data.rememberMe
        ? new Date(Date.now() + maxAge * 1000)
        : undefined,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return {
      errors: {},
      message: "An unexpected error occurred. Please try again.",
    };
  }

  redirect("/feed");
}
