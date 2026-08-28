import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.ts";

describe("password hashing", () => {
  it("uses Argon2id and round-trips", async () => {
    const hash = await hashPassword("test-password-12");
    expect(hash.startsWith("$argon2id$")).toBe(true);
    expect(await verifyPassword({ password: "test-password-12", hash })).toBe(true);
    expect(await verifyPassword({ password: "wrong-password-12", hash })).toBe(false);
  });
});
