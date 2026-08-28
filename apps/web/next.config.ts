import { loadRepoEnv } from "@flyte/db";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

loadRepoEnv();

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@flyte/db"],
  serverExternalPackages: ["argon2"],
};

export default withNextIntl(nextConfig);
