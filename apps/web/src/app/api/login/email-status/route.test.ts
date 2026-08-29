import { describe, expect, it } from "vitest";
import { POST } from "./route.ts";

describe("POST /api/login/email-status", () => {
  it("rejects a missing body", async () => {
    const response = await POST(
      new Request("http://localhost/api/login/email-status", { method: "POST" }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ exists: false });
  });

  it("rejects a malformed email", async () => {
    const response = await POST(
      new Request("http://localhost/api/login/email-status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "not-an-email" }),
      }),
    );
    expect(response.status).toBe(400);
  });
});
