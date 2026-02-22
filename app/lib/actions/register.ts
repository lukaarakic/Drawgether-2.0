"use server";

import {
  EmailSchema,
  PasswordSchema,
  UsernameSchema,
} from "@/app/utils/user-validation";
import prisma from "../db";
import z from "zod";
import { getPasswordHash } from "../auth-utils";
import { signJWT } from "../jwt";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type AuthState = {
  errors: { username?: string[]; email?: string[]; password?: string[] };
  message?: string;
};

const RegisterSchema = z
  .object({
    username: UsernameSchema,
    email: EmailSchema,
    password: PasswordSchema,
  })
  .superRefine(async (data, ctx) => {
    const [existingUsername, existingEmail] = await prisma.$transaction([
      prisma.artist.findUnique({
        where: { username: data.username },
        select: { id: true },
      }),

      prisma.artist.findUnique({
        where: { email: data.email },
        select: { id: true },
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
    const artist = await prisma.artist.create({
      data: {
        username: result.data.username,
        email: result.data.email,
        password: {
          create: {
            hash: hashedPassword,
          },
        },
        role: {
          connect: { name: "user" },
        },
      },
      select: { id: true, role: { select: { name: true } } },
    });

    const token = await signJWT({ sub: artist.id, role: artist.role.name });

    const cookieStore = await cookies();
    cookieStore.set("dg_session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
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
