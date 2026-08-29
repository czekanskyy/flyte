import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { isAuthPublicPath } from "./auth-paths.ts";
import { planningDestination, planningIsAllowed, SAFETY_ACK_VERSION } from "./safety-ack.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

const STATEMENT_PL =
  "Flyte nie jest zatwierdzonym źródłem danych lotniczych. Nie zastępuje AIP, NOTAM ani oficjalnej odprawy przedlotowej. Odpowiedzialność za przygotowanie i wykonanie lotu ponosi dowódca statku powietrznego.";

const STATEMENT_EN =
  "Flyte is not an approved source of aeronautical data. It does not replace AIP, NOTAM or an official pre-flight briefing. Responsibility for the preparation and conduct of the flight rests with the pilot in command.";

function readMessages(
  locale: "pl" | "en",
  file: "safety" | "credits",
): Record<string, Record<string, string>> {
  const text = readFileSync(resolve(repoRoot, "messages", locale, `${file}.json`), "utf8");
  return JSON.parse(text) as Record<string, Record<string, string>>;
}

describe("planning acknowledgement gate", () => {
  it("uses the SAFETY.md §1.1 version string", () => {
    expect(SAFETY_ACK_VERSION).toBe("safety-1.1");
  });

  it("does not allow planning without the current acknowledgement", () => {
    expect(planningIsAllowed(undefined)).toBe(false);
    expect(planningIsAllowed(null)).toBe(false);
    expect(planningIsAllowed("")).toBe(false);
    expect(planningIsAllowed("safety-1.0")).toBe(false);
    expect(planningDestination(null)).toBe("/acknowledge");
    expect(planningDestination("safety-1.0")).toBe("/acknowledge");
  });

  it("allows planning only after the current version is stored", () => {
    expect(planningIsAllowed("safety-1.1")).toBe(true);
    expect(planningDestination("safety-1.1")).toBe("/plan");
  });

  it("re-prompts when the stored version changes", () => {
    expect(planningIsAllowed("safety-1.2")).toBe(false);
    expect(planningDestination("safety-2.0")).toBe("/acknowledge");
  });

  it("treats /plan and /credits as authenticated, never public", () => {
    expect(isAuthPublicPath("/plan")).toBe(false);
    expect(isAuthPublicPath("/pl/plan")).toBe(false);
    expect(isAuthPublicPath("/en/plan")).toBe(false);
    expect(isAuthPublicPath("/pl/credits")).toBe(false);
    expect(isAuthPublicPath("/en/credits")).toBe(false);
    expect(isAuthPublicPath("/pl/acknowledge")).toBe(false);
  });
});

describe("SAFETY.md §1.1 copy", () => {
  it("matches the Polish statement character for character", () => {
    expect(readMessages("pl", "safety").safety?.statement).toBe(STATEMENT_PL);
  });

  it("matches the English statement character for character", () => {
    expect(readMessages("en", "safety").safety?.statement).toBe(STATEMENT_EN);
  });
});

describe("credits stub", () => {
  it("does not present OpenAIP as loaded", () => {
    const pl = readMessages("pl", "credits").credits?.openaipBody ?? "";
    const en = readMessages("en", "credits").credits?.openaipBody ?? "";
    expect(en.toLowerCase()).toContain("not loaded");
    expect(pl.toLowerCase()).toContain("nie są");
    expect(en.toLowerCase()).not.toContain("imported the polish dataset");
  });

  it("links PANSA AIS", () => {
    expect(readMessages("en", "credits").credits?.pansaHref).toBe("https://www.ais.pansa.pl/");
    expect(readMessages("pl", "credits").credits?.pansaHref).toBe("https://www.ais.pansa.pl/");
  });
});
