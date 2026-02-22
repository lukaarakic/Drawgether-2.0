"use server";

import { EmailSchema, PasswordSchema } from "@/app/utils/user-validation";
import z from "zod";
import { verifyPassword } from "../auth-utils";
import { signJWT } from "../jwt";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type AuthState = {
  errors: { username?: string[]; email?: string[]; password?: string[] };
  message?: string;
};

const LoginSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

export async function loginAction(
  prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
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

    const token = await signJWT({
      sub: validArtist.id,
      role: validArtist.role,
    });

    const cookieStore = await cookies();
    cookieStore.set("dg_session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
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
