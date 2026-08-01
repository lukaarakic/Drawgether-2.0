import { describe, expect, it } from "vitest";
import { EmailSchema, PasswordSchema, UsernameSchema } from "../user-validation";

describe("UsernameSchema", () => {
  it("accepts a valid lowercase username", () => {
    expect(UsernameSchema.parse("luka_rakic.dev")).toBe("luka_rakic.dev");
  });

  // The regex runs on the raw input before .transform(toLowerCase) ever
  // fires, so uppercase input fails validation outright — the transform
  // only ever sees already-lowercase strings, making it a no-op in
  // practice. Worth knowing if the intent was "accept any case."
  it("rejects mixed-case input rather than lowercasing it", () => {
    expect(UsernameSchema.safeParse("LukaRakic").success).toBe(false);
  });

  it("passes already-lowercase input through the transform unchanged", () => {
    expect(UsernameSchema.parse("lukarakic")).toBe("lukarakic");
  });

  it("rejects usernames shorter than 3 chars", () => {
    expect(UsernameSchema.safeParse("ab").success).toBe(false);
  });

  it("rejects usernames longer than 15 chars", () => {
    expect(UsernameSchema.safeParse("a".repeat(16)).success).toBe(false);
  });

  it("rejects disallowed characters (spaces, symbols)", () => {
    expect(UsernameSchema.safeParse("luka rakic").success).toBe(false);
    expect(UsernameSchema.safeParse("luka!rakic").success).toBe(false);
  });
});

describe("PasswordSchema", () => {
  it("accepts a password within bounds", () => {
    expect(PasswordSchema.safeParse("password123").success).toBe(true);
  });

  it("rejects passwords shorter than 6 chars", () => {
    expect(PasswordSchema.safeParse("abc12").success).toBe(false);
  });

  it("rejects passwords longer than 50 chars", () => {
    expect(PasswordSchema.safeParse("a".repeat(51)).success).toBe(false);
  });
});

describe("EmailSchema", () => {
  it("accepts and lowercases a valid email", () => {
    expect(EmailSchema.parse("Luka@Example.com")).toBe("luka@example.com");
  });

  it("rejects an invalid email", () => {
    expect(EmailSchema.safeParse("not-an-email").success).toBe(false);
  });

  it("rejects an email over 100 chars", () => {
    const longEmail = `${"a".repeat(95)}@example.com`;
    expect(EmailSchema.safeParse(longEmail).success).toBe(false);
  });
});
