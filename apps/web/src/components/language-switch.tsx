"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "../i18n/navigation.ts";
import { routing } from "../i18n/routing.ts";

export function LanguageSwitch() {
  const t = useTranslations("locale");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <nav className="locale-switch" aria-label={tNav("language")}>
      <span className="locale-label">{tNav("language")}</span>
      {routing.locales.map((code) => (
        <Link
          key={code}
          href={pathname}
          locale={code}
          aria-current={code === locale ? "true" : undefined}
        >
          {code === "pl" ? t("pl") : t("en")}
        </Link>
      ))}
    </nav>
  );
}
