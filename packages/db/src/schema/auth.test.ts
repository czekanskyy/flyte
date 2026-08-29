import { getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { account, passkey, session, user, verification } from "./auth.ts";
import { safetyAcknowledgement } from "./safety-ack.ts";

describe("auth schema", () => {
  it("exposes the Better Auth tables FLY-012 is allowed to create", () => {
    expect(getTableName(user)).toBe("user");
    expect(getTableName(session)).toBe("session");
    expect(getTableName(account)).toBe("account");
    expect(getTableName(verification)).toBe("verification");
    expect(getTableName(passkey)).toBe("passkey");
  });

  it("stores Better Auth 1.7.2 account issuer for identity uniqueness", () => {
    expect(account.issuer.name).toBe("issuer");
  });

  it("keeps the safety acknowledgement on a 1:1 table, not on user", () => {
    expect(getTableName(safetyAcknowledgement)).toBe("safety_acknowledgement");
    expect(safetyAcknowledgement.version.name).toBe("version");
    expect(safetyAcknowledgement.acknowledgedAt.name).toBe("acknowledged_at");
  });
});
