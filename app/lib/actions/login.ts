"use server";

import { EmailSchema, PasswordSchema } from "@/app/utils/user-validation";
import z from "zod";
import { verifyPassword } from "../auth-utils";
import { signJWT } from "../jwt";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateHoneypot } from "../security";

export type AuthState = {
  errors: { username?: string[]; email?: string[]; password?: string[] };
  message?: string;
};

const LoginSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  rememberMe: z
    .literal("on")
    .optional()
    .transform((val) => val === "on"),
});

export async function loginAction(
  prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!validateHoneypot(formData))
    return {
      errors: {},
      message: "Unkown error occurred. Please try again.",
    };

  const data = Object.fromEntries(formData.entries());
  const result = await LoginSchema.safeParseAsync(data);

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      message: "Something went wrong",
    };
  }

  try {
    const validArtist = await verifyPassword(
      result.data.email,
      result.data.password,
    );

    if (!validArtist) {
      return {
        errors: {},
        message: "Invalid email or password",
      };
    }

    const token = await signJWT(
      {
        sub: validArtist.id,
        role: validArtist.role,
      },
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
    console.error("Login error:", error);
    return {
      errors: {},
      message: "An unexpected error occurred. Please try again.",
    };
  }

  redirect("/feed");
}
