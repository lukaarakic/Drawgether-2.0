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
import {
  checkArtistAvailability,
  createArtistAccount,
  getRoleByName,
} from "../data/auth";

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
    const { usernameTaken, emailTaken } = await checkArtistAvailability({
      username: data.username,
      email: data.email,
    });

    if (usernameTaken) {
      ctx.addIssue({
        code: "custom",
        message: "Username is already taken",
        path: ["username"],
      });
    }

    if (emailTaken) {
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

    const userRole = await getRoleByName("user");

    if (!userRole) {
      return {
        errors: {},
        message: "Role configuration error. Please contact support.",
      };
    }

    const createdArtist = await createArtistAccount({
      username: result.data.username,
      email: result.data.email,
      roleId: userRole.id,
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(result.data.username)}`,
      passwordHash: hashedPassword,
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
