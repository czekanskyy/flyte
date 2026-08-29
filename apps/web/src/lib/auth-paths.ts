import { routing } from "../i18n/routing.ts";

export function stripLocalePrefix(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1);
    }
  }
  return pathname;
}

export function localeFromPath(pathname: string): (typeof routing.locales)[number] {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return locale;
    }
  }
  return routing.defaultLocale;
}

export function isAuthPublicPath(pathname: string): boolean {
  const rest = stripLocalePrefix(pathname);
  return (
    rest === "/login" ||
    rest.startsWith("/login/") ||
    rest === "/offline" ||
    rest.startsWith("/offline/")
  );
}
