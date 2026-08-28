import { getSessionCookie } from "better-auth/cookies";
import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing.ts";
import { isAuthPublicPath, localeFromPath } from "./lib/auth-paths.ts";

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isAuthPublicPath(pathname) && !getSessionCookie(request)) {
    const locale = localeFromPath(pathname);
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
