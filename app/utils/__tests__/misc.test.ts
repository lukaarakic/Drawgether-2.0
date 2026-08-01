import { describe, expect, it } from "vitest";
import { generateRoomCode, maskEmail } from "../misc";

describe("maskEmail", () => {
  it("masks the middle of the username, keeping first and last char", () => {
    expect(maskEmail("lukarakic@example.com")).toBe("l***c@example.com");
  });

  it("preserves the domain unchanged", () => {
    expect(maskEmail("ab@sub.example.co.uk")).toMatch(/@sub\.example\.co\.uk$/);
  });

  it("handles a two-character username without throwing", () => {
    // username.charAt(0) === username.charAt(length-1) here; documents current behavior.
    expect(maskEmail("ab@example.com")).toBe("a***b@example.com");
  });
});

describe("generateRoomCode", () => {
  it("returns a 6-character code", () => {
    expect(generateRoomCode()).toHaveLength(6);
  });

  it("only uses uppercase letters and digits", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateRoomCode()).toMatch(/^[A-Z0-9]{6}$/);
    }
  });

  it("is not trivially constant across calls", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateRoomCode()));
    // 36^6 possibilities — 20 draws colliding down to 1 unique value is
    // statistically impossible unless the generator is broken.
    expect(codes.size).toBeGreaterThan(1);
  });
});
