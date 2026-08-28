import { afterEach, describe, expect, it } from "vitest";
import { getAuthFeatures } from "./auth.ts";

const KEYS = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "SMTP_FROM",
] as const;

describe("getAuthFeatures", () => {
  const saved: Partial<Record<(typeof KEYS)[number], string | undefined>> = {};

  afterEach(() => {
    for (const key of KEYS) {
      const value = saved[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
      delete saved[key];
    }
  });

  function setEnv(key: (typeof KEYS)[number], value: string): void {
    saved[key] ??= process.env[key];
    process.env[key] = value;
  }

  it("always enables email/password and passkeys", () => {
    expect(getAuthFeatures().emailPassword).toBe(true);
    expect(getAuthFeatures().passkeys).toBe(true);
  });

  it("hides Google when either credential is empty", () => {
    setEnv("GOOGLE_CLIENT_ID", "");
    setEnv("GOOGLE_CLIENT_SECRET", "");
    expect(getAuthFeatures().google).toBe(false);
    setEnv("GOOGLE_CLIENT_ID", "id-only");
    expect(getAuthFeatures().google).toBe(false);
  });

  it("shows Google when both credentials are set", () => {
    setEnv("GOOGLE_CLIENT_ID", "google-id");
    setEnv("GOOGLE_CLIENT_SECRET", "google-secret");
    expect(getAuthFeatures().google).toBe(true);
  });

  it("hides magic link when SMTP is incomplete", () => {
    setEnv("SMTP_HOST", "");
    setEnv("SMTP_USER", "");
    setEnv("SMTP_PASSWORD", "");
    setEnv("SMTP_FROM", "");
    expect(getAuthFeatures().magicLink).toBe(false);
  });

  it("shows magic link when SMTP is fully configured", () => {
    setEnv("SMTP_HOST", "smtp.example.test");
    setEnv("SMTP_USER", "flyte");
    setEnv("SMTP_PASSWORD", "secret");
    setEnv("SMTP_FROM", "noreply@flyte.czekanski.dev");
    expect(getAuthFeatures().magicLink).toBe(true);
  });
});
