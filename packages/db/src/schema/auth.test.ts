import { getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { account, passkey, session, user, verification } from "./auth.ts";

describe("auth schema", () => {
  it("exposes the Better Auth tables FLY-012 is allowed to create", () => {
    expect(getTableName(user)).toBe("user");
    expect(getTableName(session)).toBe("session");
    expect(getTableName(account)).toBe("account");
    expect(getTableName(verification)).toBe("verification");
    expect(getTableName(passkey)).toBe("passkey");
  });
});
