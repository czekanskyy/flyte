import { loadRepoEnv } from "@flyte/db";
import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

loadRepoEnv();

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@flyte/db", "@flyte/ui"],
  serverExternalPackages: ["argon2"],
};

// @serwist/next 9.5.12 is a webpack plugin. Next 16's default Turbopack build
// does not run it, so production uses `next build --webpack`. Dev stays on
// Turbopack with the worker disabled (production-only registration).
const withSerwist = withSerwistInit({
  swSrc: "sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  additionalPrecacheEntries: [
    { url: "/pl/offline", revision: "fly-016-offline-1" },
    { url: "/en/offline", revision: "fly-016-offline-1" },
  ],
});

export default withSerwist(withNextIntl(nextConfig));
