import { hasLocale } from "next-intl";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { AppChrome } from "../../../components/app-chrome.tsx";
import { redirect } from "../../../i18n/navigation.ts";
import { routing } from "../../../i18n/routing.ts";
import { getAuth, isAuthConfigured } from "../../../lib/auth.ts";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export const dynamic = "force-dynamic";

export default async function AppGroupLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    redirect({ href: "/login", locale: routing.defaultLocale });
  }
  if (!isAuthConfigured()) {
    redirect({ href: "/login", locale });
  }
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    redirect({ href: "/login", locale });
  }
  return <AppChrome appLinks>{children}</AppChrome>;
}
