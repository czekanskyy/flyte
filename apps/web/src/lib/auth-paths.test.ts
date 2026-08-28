import { describe, expect, it } from "vitest";
import { isAuthPublicPath, localeFromPath, stripLocalePrefix } from "./auth-paths.ts";

describe("auth path helpers", () => {
  it("treats /login as public in both locales", () => {
    expect(isAuthPublicPath("/login")).toBe(true);
    expect(isAuthPublicPath("/pl/login")).toBe(true);
    expect(isAuthPublicPath("/en/login")).toBe(true);
    expect(isAuthPublicPath("/pl/login/extra")).toBe(true);
  });

  it("treats the app home as gated", () => {
    expect(isAuthPublicPath("/")).toBe(false);
    expect(isAuthPublicPath("/pl")).toBe(false);
    expect(isAuthPublicPath("/en")).toBe(false);
    expect(isAuthPublicPath("/pl/")).toBe(false);
  });

  it("strips the locale prefix", () => {
    expect(stripLocalePrefix("/pl")).toBe("/");
    expect(stripLocalePrefix("/en/login")).toBe("/login");
    expect(stripLocalePrefix("/login")).toBe("/login");
  });

  it("reads the locale from the path, defaulting to pl", () => {
    expect(localeFromPath("/en/login")).toBe("en");
    expect(localeFromPath("/pl")).toBe("pl");
    expect(localeFromPath("/")).toBe("pl");
  });
});
