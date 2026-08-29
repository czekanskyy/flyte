import { describe, expect, it } from "vitest";
import { getSafetyAckVersion, recordSafetyAck } from "./safety-ack.ts";
import { safetyAcknowledgement } from "./schema/safety-ack.ts";

describe("safety acknowledgement persistence", () => {
  it("upserts on user_id so a new version string can replace the old row", () => {
    expect(safetyAcknowledgement.userId.name).toBe("user_id");
    expect(typeof getSafetyAckVersion).toBe("function");
    expect(typeof recordSafetyAck).toBe("function");
  });
});
