import { z } from "zod";

export const UsernameSchema = z
  .string("Username is required")
  .min(3, { message: "Username is too short" })
  .max(15, { message: "Username is too long" })
  .regex(/^[a-z0-9_.]+$/, {
    message:
      "Username can only include lowercase letters, numbers, and underscores",
  })
  .transform((value) => value.toLowerCase());

export const PasswordSchema = z
  .string("Password is required")
  .min(6, { message: "Password is too short" })
  .max(50, { message: "Password is too long" });
export const EmailSchema = z
  .email("Email is invalid")
  .min(3, { message: "Email is too short" })
  .max(100, { message: "Email is too long" })
  .transform((value) => value.toLowerCase());
