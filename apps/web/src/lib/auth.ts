import { passkey } from "@better-auth/passkey";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import {
  account,
  getDb,
  loadRepoEnv,
  passkey as passkeyTable,
  session,
  user,
  verification,
} from "@flyte/db";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import type { AuthFeatures } from "./auth-types.ts";
import { hashPassword, verifyPassword } from "./password.ts";
import { isSmtpConfigured, sendSmtpMail } from "./smtp.ts";

export type { AuthFeatures } from "./auth-types.ts";

export function isGoogleConfigured(): boolean {
  loadRepoEnv();
  const id = process.env.GOOGLE_CLIENT_ID?.trim();
  const secret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  return Boolean(id && secret);
}

export function getAuthFeatures(): AuthFeatures {
  return {
    emailPassword: true,
    passkeys: true,
    google: isGoogleConfigured(),
    magicLink: isSmtpConfigured(),
  };
}

export function isAuthConfigured(): boolean {
  loadRepoEnv();
  return Boolean(
    process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET && process.env.BETTER_AUTH_URL,
  );
}

function requireEnv(name: "BETTER_AUTH_SECRET" | "BETTER_AUTH_URL"): string {
  loadRepoEnv();
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not set.`);
  }
  return value;
}

function createAuth() {
  const secret = requireEnv("BETTER_AUTH_SECRET");
  if (secret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must be at least 32 characters.");
  }
  const baseURL = requireEnv("BETTER_AUTH_URL").replace(/\/$/, "");
  const origin = new URL(baseURL);
  const features = getAuthFeatures();
  const googleId = process.env.GOOGLE_CLIENT_ID?.trim();
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  return betterAuth({
    secret,
    baseURL,
    trustedOrigins: [baseURL, "http://localhost:3000", "https://flyte.czekanski.dev"],
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: { user, session, account, verification, passkey: passkeyTable },
      // neon-http (FLY-012) has no transactions.
      transaction: false,
    }),
    emailAndPassword: {
      enabled: true,
      password: {
        hash: hashPassword,
        verify: verifyPassword,
      },
    },
    socialProviders:
      features.google && googleId && googleSecret
        ? {
            google: {
              clientId: googleId,
              clientSecret: googleSecret,
            },
          }
        : {},
    plugins: [
      passkey({
        rpID: origin.hostname,
        rpName: "Flyte",
        origin: origin.origin,
      }),
      ...(features.magicLink
        ? [
            magicLink({
              sendMagicLink: async ({ email, url }) => {
                await sendSmtpMail({
                  to: email,
                  subject: "Flyte",
                  text: [
                    "Flyte",
                    "",
                    "PL: Kliknij, aby się zalogować.",
                    "EN: Click to sign in.",
                    "",
                    url,
                  ].join("\n"),
                });
              },
            }),
          ]
        : []),
      nextCookies(),
    ],
  });
}

type AuthInstance = ReturnType<typeof createAuth>;

let authSingleton: AuthInstance | undefined;

export function getAuth(): AuthInstance {
  authSingleton ??= createAuth();
  return authSingleton;
}
