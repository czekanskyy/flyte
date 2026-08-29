import { describe, expect, it } from "vitest";
import { normalizeLoginEmail } from "./login-email.ts";

describe("normalizeLoginEmail", () => {
  it("accepts a normal address and lowercases it", () => {
    expect(normalizeLoginEmail("  Pilot@Example.COM ")).toBe("pilot@example.com");
  });

  it("rejects missing or malformed values", () => {
    expect(normalizeLoginEmail(null)).toBe(null);
    expect(normalizeLoginEmail("")).toBe(null);
    expect(normalizeLoginEmail("not-an-email")).toBe(null);
  });
});
