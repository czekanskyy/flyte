import { describe, expect, it } from "vitest";
import { applyTheme, DEFAULT_THEME, isTheme } from "./theme.ts";

function stubRoot() {
  const attrs = new Map<string, string>();
  return {
    setAttribute(name: string, value: string) {
      attrs.set(name, value);
    },
    getAttribute(name: string) {
      return attrs.get(name);
    },
  };
}

describe("theme", () => {
  it("accepts the three named themes only", () => {
    expect(isTheme("light")).toBe(true);
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("night")).toBe(true);
    expect(isTheme("solarized")).toBe(false);
    expect(DEFAULT_THEME).toBe("dark");
  });

  it("writes data-theme on the root", () => {
    const root = stubRoot();
    applyTheme("night", root as unknown as HTMLElement);
    expect(root.getAttribute("data-theme")).toBe("night");
  });
});
