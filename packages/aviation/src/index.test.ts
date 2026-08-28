import { describe, expect, it } from "vitest";
import { packageName } from "./index.ts";

describe("@flyte/aviation", () => {
  it("exports its package name", () => {
    expect(packageName).toBe("@flyte/aviation");
  });
});
